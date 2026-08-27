const CLAVE_PROGRESO = 'lumi_progreso_tareas';
const CLAVE_GAMIFICACION = 'lumi_gamificacion';
const PUNTOS_POR_TAREA = 5;
const HITOS_LOGROS = [
  { cantidad: 1, nombre: 'Mi primera tarea' },
  { cantidad: 5, nombre: 'Mis primeras cinco tareas' },
  { cantidad: 10, nombre: '10 tareas completadas' },
  { cantidad: 20, nombre: '20 tareas completadas' },
  { cantidad: 50, nombre: '50 tareas completadas' },
  { cantidad: 75, nombre: '75 tareas completadas' },
  { cantidad: 100, nombre: '100 tareas completadas' }
];

export function obtenerProgresoTareas() {
  return leerObjeto(CLAVE_PROGRESO);
}

export function estaTareaCompletada(planId) {
  if (planId == null || planId === '') return false;
  return Boolean(obtenerProgresoTareas()[String(planId)]?.completada);
}

export function obtenerEstadoTareaLocal(tareaId, estadoPredeterminado = false) {
  if (tareaId == null || tareaId === '') return Boolean(estadoPredeterminado);
  const estados = leerObjeto('lumi_estados_tareas');
  return Object.prototype.hasOwnProperty.call(estados, String(tareaId)) ? Boolean(estados[String(tareaId)]) : Boolean(estadoPredeterminado);
}

export function guardarEstadoTareaLocal(tareaId, completada) {
  if (tareaId == null || tareaId === '') return;
  const estados = leerObjeto('lumi_estados_tareas');
  estados[String(tareaId)] = Boolean(completada);
  localStorage.setItem('lumi_estados_tareas', JSON.stringify(estados));
  window.dispatchEvent(new CustomEvent('lumi:tarea-estado-actualizado', { detail: { tareaId: String(tareaId), completada: Boolean(completada) } }));
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
  if (!progreso[clavePlan]?.pasos_completados) return false;

  const estadoPlan = { ...progreso[clavePlan] };
  delete estadoPlan.pasos_completados;
  if (Object.keys(estadoPlan).length) progreso[clavePlan] = estadoPlan;
  else delete progreso[clavePlan];
  guardarObjeto(CLAVE_PROGRESO, progreso);
  window.dispatchEvent(new CustomEvent('lumi:pasos-reiniciados', { detail: { planId: clavePlan } }));
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

export function completarTareaLocal(planId) {
  if (planId == null || planId === '') return { nueva: false, progreso: obtenerProgresoTareas(), gamificacion: obtenerGamificacionLocal() };

  const clavePlan = String(planId);
  const progreso = obtenerProgresoTareas();
  if (progreso[clavePlan]?.completada) {
    return { nueva: false, progreso, gamificacion: obtenerGamificacionLocal() };
  }

  const fecha = new Date().toISOString();
  progreso[clavePlan] = { ...(progreso[clavePlan] || {}), completada: true, fecha_completado: fecha };
  guardarObjeto(CLAVE_PROGRESO, progreso);

  const gamificacion = actualizarGamificacion(fecha.slice(0, 10));
  const resultado = { nueva: true, progreso, gamificacion };
  window.dispatchEvent(new CustomEvent('lumi:progreso-actualizado', { detail: resultado }));
  return resultado;
}

export function obtenerTareasCompletadas() {
  return Object.entries(obtenerProgresoTareas())
    .filter(([, estado]) => estado?.completada)
    .map(([planId, estado]) => ({ planId, ...estado }));
}

export function obtenerCantidadTareasCompletadas() {
  return obtenerTareasCompletadas().length;
}

export function obtenerGamificacionLocal() {
  const guardado = leerObjeto(CLAVE_GAMIFICACION);
  const cantidad = obtenerCantidadTareasCompletadas();
  const tieneTareas = cantidad > 0;
  return {
    puntos: Number.isFinite(Number(guardado.puntos)) ? Number(guardado.puntos) : cantidad * PUNTOS_POR_TAREA,
    tareas_completadas: cantidad,
    racha: tieneTareas ? Number(guardado.racha) || 0 : 0,
    ultima_actividad: guardado.ultima_actividad || null,
    mejor_racha: tieneTareas ? Number(guardado.mejor_racha) || 0 : 0,
    dias_activos: Array.isArray(guardado.dias_activos) ? guardado.dias_activos : [],
    logros_desbloqueados: Array.isArray(guardado.logros_desbloqueados) ? guardado.logros_desbloqueados : []
  };
}

export function obtenerLogrosLocales() {
  const gamificacion = obtenerGamificacionLocal();
  return HITOS_LOGROS.map(hito => ({
    ...hito,
    desbloqueada: gamificacion.tareas_completadas >= hito.cantidad,
    fecha_obtencion: gamificacion.logros_desbloqueados.find(logro => logro.nombre === hito.nombre)?.fecha_obtencion || null
  }));
}

function actualizarGamificacion(fechaActual) {
  const anterior = leerObjeto(CLAVE_GAMIFICACION);
  const cantidad = obtenerCantidadTareasCompletadas();
  const diasActivos = Array.isArray(anterior.dias_activos) ? anterior.dias_activos : [];
  if (!diasActivos.includes(fechaActual)) diasActivos.push(fechaActual);

  const ultimaActividad = anterior.ultima_actividad;
  let racha = Number(anterior.racha) || 0;
  if (!ultimaActividad) {
    racha = 1;
  } else if (ultimaActividad === fechaActual) {
    racha = Math.max(racha, 1);
  } else if (diferenciaDias(ultimaActividad, fechaActual) === 1) {
    racha += 1;
  } else {
    racha = 1;
  }

  const logrosAnteriores = Array.isArray(anterior.logros_desbloqueados) ? anterior.logros_desbloqueados : [];
  const logrosDesbloqueados = [...logrosAnteriores];
  HITOS_LOGROS.filter(hito => cantidad >= hito.cantidad).forEach(hito => {
    if (!logrosDesbloqueados.some(logro => logro.nombre === hito.nombre)) {
      logrosDesbloqueados.push({ nombre: hito.nombre, fecha_obtencion: new Date().toISOString() });
    }
  });

  const gamificacion = {
    puntos: cantidad * PUNTOS_POR_TAREA,
    tareas_completadas: cantidad,
    racha,
    ultima_actividad: fechaActual,
    mejor_racha: Math.max(Number(anterior.mejor_racha) || 0, racha),
    dias_activos: diasActivos,
    logros_desbloqueados: logrosDesbloqueados
  };
  guardarObjeto(CLAVE_GAMIFICACION, gamificacion);
  return gamificacion;
}

function diferenciaDias(fechaAnterior, fechaActual) {
  const anterior = new Date(`${fechaAnterior}T00:00:00`);
  const actual = new Date(`${fechaActual}T00:00:00`);
  return Math.round((actual - anterior) / 86400000);
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
