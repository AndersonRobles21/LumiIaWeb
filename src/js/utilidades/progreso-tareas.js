const CLAVE_PROGRESO = 'lumi_progreso_tareas';

export function obtenerProgresoTareas() {
  return leerObjeto(CLAVE_PROGRESO);
}

export function obtenerPasosCompletados(planId) {
  if (planId == null || planId === '') return [];
  const pasos = obtenerProgresoTareas()[String(planId)]?.pasos_completados;
  return Array.isArray(pasos) ? [...new Set(pasos.map(Number).filter(numero => Number.isInteger(numero) && numero > 0))].sort((a, b) => a - b) : [];
}

export function estaPasoCompletado(planId, numeroPaso) {
  return obtenerPasosCompletados(planId).includes(Number(numeroPaso));
}

export function reiniciarProgresoPlan(planId) {
  if (planId == null || planId === '') return false;
  const clavePlan = String(planId);
  const progreso = obtenerProgresoTareas();
  if (!progreso[clavePlan]) return false;

  const estadoPlan = { ...progreso[clavePlan] };
  delete estadoPlan.pasos_completados;
  delete estadoPlan.completada;
  delete estadoPlan.puntos;
  if (Object.keys(estadoPlan).length) progreso[clavePlan] = estadoPlan;
  else delete progreso[clavePlan];
  guardarObjeto(CLAVE_PROGRESO, progreso);
  window.dispatchEvent(new CustomEvent('lumi:pasos-reiniciados', { detail: { planId: clavePlan } }));
  return true;
}

export function eliminarProgresoPlan(planId) {
  if (planId == null || planId === '') return false;
  const clavePlan = String(planId);
  const progreso = obtenerProgresoTareas();
  if (!Object.prototype.hasOwnProperty.call(progreso, clavePlan)) return false;
  delete progreso[clavePlan];
  guardarObjeto(CLAVE_PROGRESO, progreso);
  return true;
}

export function completarPaso(planId, numeroPaso) {
  if (planId == null || planId === '' || !Number.isInteger(Number(numeroPaso)) || Number(numeroPaso) < 1) return false;
  const clavePlan = String(planId);
  const numero = Number(numeroPaso);
  const progreso = obtenerProgresoTareas();
  const pasos = obtenerPasosCompletados(clavePlan);
  if (pasos.includes(numero)) return false;
  if (numero > 1 && !pasos.includes(numero - 1)) return false;
  progreso[clavePlan] = { ...(progreso[clavePlan] || {}), completada: Boolean(progreso[clavePlan]?.completada), pasos_completados: [...pasos, numero].sort((a, b) => a - b) };
  guardarObjeto(CLAVE_PROGRESO, progreso);
  window.dispatchEvent(new CustomEvent('lumi:paso-actualizado', { detail: { planId: clavePlan, numeroPaso: numero } }));
  return true;
}

export function todosLosPasosCompletados(planId, totalPasos) {
  const total = Number(totalPasos);
  return total > 0 && obtenerPasosCompletados(planId).length >= total && Array.from({ length: total }, (_, indice) => indice + 1).every(numero => estaPasoCompletado(planId, numero));
}

export function completarPlan(planId) {
  if (planId == null || planId === '') return false;
  const clavePlan = String(planId);
  const progreso = obtenerProgresoTareas();
  const estadoPlan = progreso[clavePlan] || {};
  progreso[clavePlan] = { ...estadoPlan, completada: true, puntos: Number(estadoPlan.puntos) || 10 };
  guardarObjeto(CLAVE_PROGRESO, progreso);
  window.dispatchEvent(new CustomEvent('lumi:plan-completado', { detail: { planId: clavePlan } }));
  return true;
}

function leerObjeto(clave) {
  try {
    const valor = JSON.parse(localStorage.getItem(clave) || '{}');
    return valor && typeof valor === 'object' && !Array.isArray(valor) ? valor : {};
  } catch {
    return {};
  }
}

function guardarObjeto(clave, valor) {
  localStorage.setItem(clave, JSON.stringify(valor));
}
