import { supabase } from '../config/supabase.js';
import { obtenerPlanesUsuarioBD } from '../servicios/planes.service.js';
import { obtenerUsuarioActual } from '../servicios/autenticacion.service.js';
import { completarPaso, completarTareaLocal, estaPasoCompletado, estaTareaCompletada, obtenerPasosCompletados, todosLosPasosCompletados } from '../utilidades/progreso-tareas.js';

let listaPlanesGlobal = [];
let planSeleccionado = null;

export async function initHistorial() {
  const contenedorLista = document.getElementById('lista-conversaciones');
  if (!contenedorLista) return;

  configurarBuscador();
  configurarChipsSugerencias();

  try {
    let usuarioId = null;

    // Obtener id del usuario actual
    try {
      const usuario = await obtenerUsuarioActual();
      usuarioId = usuario?.id;
    } catch {
      const { data: { session } } = await supabase.auth.getSession();
      usuarioId = session?.user?.id;
    }

    if (!usuarioId) {
      contenedorLista.innerHTML = `<p style="padding: 1rem; color: #8a8f9d;">Inicia sesión para ver tu historial de tareas.</p>`;
      return;
    }

    // Consulta real a Supabase (tablas planes_estudio y actividades)
    const planes = await obtenerPlanesUsuarioBD(usuarioId);
    listaPlanesGlobal = deduplicarPlanes(planes, usuarioId);

    if (listaPlanesGlobal.length > 0) {
      renderizarListaPlanes(listaPlanesGlobal, contenedorLista);
      // Seleccionar automáticamente el primer plan
      seleccionarPlan(listaPlanesGlobal[0]);
    } else {
      contenedorLista.innerHTML = `<p style="padding: 1rem; color: #8a8f9d;">No tienes tareas registradas en la base de datos.</p>`;
    }

  } catch (error) {
    console.error('Error al cargar historial desde Supabase:', error);
    contenedorLista.innerHTML = `<p style="padding: 1rem; color: #8a8f9d;">Error al sincronizar con la base de datos.</p>`;
  }
}

function deduplicarPlanes(planes, usuarioId) {
  const vistos = new Set();
  return (Array.isArray(planes) ? planes : []).filter(plan => {
    const clave = obtenerClavePlan(plan, usuarioId);
    if (vistos.has(clave)) return false;
    vistos.add(clave);
    return true;
  });
}

function obtenerClavePlan(plan, usuarioId) {
  if (plan?.id != null && plan.id !== '') return `plan:${plan.id}`;
  const tareaId = obtenerIdTareaGeneral(plan);
  if (tareaId) return `tarea:${tareaId}`;
  const nombre = normalizarClave(plan?.nombre || plan?.titulo);
  const fecha = normalizarClave(plan?.fecha_creacion || plan?.fecha_entrega || plan?.fecha);
  const descripcion = normalizarClave(plan?.descripcion);
  return `sin-id:${usuarioId}:${nombre}:${fecha}:${descripcion}`;
}

function normalizarClave(valor) {
  return String(valor ?? '').trim().toLowerCase().replace(/\s+/g, ' ');
}

function renderizarListaPlanes(planes, contenedor) {
  contenedor.innerHTML = `<div class="grupo-fecha-label">Tus tareas guardadas</div>`;

  planes.forEach((plan, index) => {
    const esActiva = index === 0 ? 'activa' : '';
    const titulo = plan.nombre || 'Tarea sin nombre';
    const descripcion = plan.descripcion || 'Sin descripción';
    const hora = plan.fecha_creacion 
      ? new Date(plan.fecha_creacion).toLocaleDateString([], { month: 'short', day: 'numeric' })
      : 'Hoy';

    const itemHTML = `
      <div class="item-conversacion ${esActiva}" data-id="${escapar(plan.id)}" data-index="${index}">
        <div class="avatar-lumi-sm">🤖</div>
        <div class="info-conversacion">
          <h4>${escapar(titulo)}</h4>
          <p>${escapar(descripcion)}</p>
        </div>
        <span class="hora-item">${hora}</span>
      </div>
    `;

    contenedor.insertAdjacentHTML('beforeend', itemHTML);
  });

  configurarEventosSeleccion();
}

function configurarEventosSeleccion() {
  const items = document.querySelectorAll('.item-conversacion');

  items.forEach(elemento => {
    elemento.addEventListener('click', () => {
      items.forEach(el => el.classList.remove('activa'));
      elemento.classList.add('activa');

      const index = elemento.getAttribute('data-index');
      if (listaPlanesGlobal[index]) {
        seleccionarPlan(listaPlanesGlobal[index]);
      }
    });
  });
}

function seleccionarPlan(plan) {
  planSeleccionado = plan;
  const pasoActual = document.getElementById('contenedor-paso-actual');
  const resumen = document.getElementById('contenedor-resumen-historial');
  const pasosVisibles = document.getElementById('contenedor-pasos-historial');
  if (pasoActual) pasoActual.hidden = true;
  if (resumen) resumen.hidden = true;
  if (pasosVisibles) pasosVisibles.hidden = false;
  const elTitulo = document.getElementById('chat-titulo-tarea');
  const elSaludo = document.getElementById('texto-saludo-lumi');
  const elMetodo = document.getElementById('nombre-metodo-activo');
  const elHora = document.getElementById('hora-plan');
  const contenedorPasos = document.getElementById('contenedor-pasos-historial');

  if (elTitulo) elTitulo.textContent = plan.nombre || 'Plan de Estudio';
  if (elMetodo) elMetodo.textContent = plan.metodo_estudio || 'Pomodoro (Sugerido por IA)';
  
  if (elSaludo) {
    elSaludo.textContent = `¡Hola! Aquí tienes los detalles y actividades registradas para "${plan.nombre}". ¿Quieres repasar algún punto?`;
  }

  if (elHora && plan.fecha_creacion) {
    elHora.textContent = new Date(plan.fecha_creacion).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  // Renderizar actividades asociadas de la base de datos
  if (contenedorPasos) {
    const actividades = plan.actividades || plan.fases || plan.pasos || plan.tareas || [];
      if (actividades.length > 0) {
        renderizarPasosHistorial(plan, actividades, contenedorPasos);
    } else {
      contenedorPasos.innerHTML = `
        <div style="padding: 0.85rem; background: rgba(255,255,255,0.03); border-radius: 8px; font-size: 0.88rem; color: #b0b5c0;">
          📌 <strong>Descripción registrada:</strong> ${escapar(plan.descripcion || 'Sin información adicional del plan.')}
        </div>
      `;
    }
  }
}

  function renderizarPasosHistorial(plan, actividades, contenedor) {
    const totalPasos = actividades.length;
    const completados = obtenerPasosCompletados(plan.id).length;
    contenedor.innerHTML = `<p class="progreso-pasos">Progreso: ${completados}/${totalPasos} pasos</p>${actividades.map((actividad, indice) => {
      const completado = estaPasoCompletado(plan.id, indice + 1);
      const disponible = !completado && (indice === 0 || estaPasoCompletado(plan.id, indice));
      const contenido = actividad.descripcion || actividad.contenido || actividad.detalle;
      return `<article class="paso-ia ${completado ? 'completado' : disponible ? 'disponible' : 'bloqueado'}"><strong>${completado ? '✓' : disponible ? indice + 1 : '🔒'} PASO ${indice + 1}: ${escapar(actividad.titulo || actividad.nombre || `Fase ${indice + 1}`)}</strong>${contenido ? `<p>${escapar(contenido)}</p>` : '<p>Sin descripción disponible</p>'}${completado ? '<span class="paso-mensaje">✓ Paso completado</span>' : disponible ? `<button type="button" class="btn-confirmar-paso" data-paso="${indice + 1}">✓ Confirmar paso</button>` : '<span class="paso-mensaje">Completa el paso anterior</span>'}</article>`;
    }).join('')}`;
    contenedor.querySelectorAll('.btn-confirmar-paso').forEach(boton => boton.addEventListener('click', () => {
      const numeroPaso = Number(boton.dataset.paso);
      if (completarPaso(plan.id, numeroPaso)) seleccionarPlan(plan);
    }));
  }
function configurarBuscador() {
  const inputBuscador = document.getElementById('input-buscar-historial');
  if (!inputBuscador) return;

  inputBuscador.addEventListener('input', (e) => {
    const termino = e.target.value.toLowerCase();
    const items = document.querySelectorAll('.item-conversacion');

    items.forEach(item => {
      const coincidencia = item.textContent.toLowerCase().includes(termino);
      item.style.display = coincidencia ? 'flex' : 'none';
    });
  });
}

function configurarChipsSugerencias() {
  const chips = document.querySelectorAll('.chip-btn');
  chips.forEach(chip => {
    chip.addEventListener('click', () => {
      const accion = chip.dataset.accion;
      if (accion === 'paso_a_paso') {
        renderizarPasoPendiente();
        document.getElementById('contenedor-paso-actual')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else if (accion === 'explica_tarea' && planSeleccionado) {
        mostrarResumenPlan();
      }
    });
  });

  const botonRayo = document.getElementById('btn-metodo-metrica');
  const botonCambiar = document.getElementById('btn-cambiar-metodo');
  [botonRayo, botonCambiar].forEach(boton => boton?.addEventListener('click', () => {
    if (!planSeleccionado?.id) return;
    window.location.href = `guia-detalle.html?plan_id=${encodeURIComponent(planSeleccionado.id)}`;
  }));
}

// Inicialización
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initHistorial);
} else {
  initHistorial();
}

function renderizarSubtareas(actividad) {
  const subtareas = actividad.subtareas || actividad.tareas || [];
  if (!Array.isArray(subtareas) || !subtareas.length) return '';
  return `<div class="checklist-subtareas">${subtareas.map(subtarea => {
    const id = subtarea.id;
    const titulo = escapar(subtarea.titulo || subtarea.nombre || 'Subtarea');
    return id ? `<label><input type="checkbox" data-subtarea-id="${escapar(id)}" ${subtarea.completada ? 'checked' : ''} disabled>${titulo}</label>` : `<span>${titulo}</span>`;
  }).join('')}</div>`;
}

function escapar(valor) {
  return String(valor).replace(/[&<>"']/g, caracter => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[caracter]);
}

function actualizarResumenPlan(plan, actividades) {
  const resumen = document.getElementById('contenedor-resumen-historial');
  if (!resumen) return;
  const completadas = obtenerPasosCompletados(plan.id).length;
  const progreso = actividades.length ? Math.round((completadas / actividades.length) * 100) : null;
  resumen.innerHTML = `<strong>Objetivo</strong><p>${escapar(plan.objetivo || plan.descripcion || 'Sin objetivo disponible')}</p><strong>Progreso</strong><p>${actividades.length ? `${completadas} de ${actividades.length} pasos completados (${Math.round((completadas / actividades.length) * 100)}%)` : 'Este plan no contiene pasos.'}</p>`;
}

function mostrarResumenPlan() {
  const resumen = document.getElementById('contenedor-resumen-historial');
  if (!resumen || !planSeleccionado) return;
  resumen.hidden = false;
  resumen.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function renderizarPasoPendiente() {
  const contenedor = document.getElementById('contenedor-paso-actual');
  if (!contenedor || !planSeleccionado) return;
  const actividades = planSeleccionado.actividades || [];
  const pasosVisibles = document.getElementById('contenedor-pasos-historial');
  if (pasosVisibles) pasosVisibles.hidden = true;
  const indice = actividades.findIndex(actividad => !estaCompletada(actividad));
  contenedor.hidden = false;
  if (indice === -1) {
    contenedor.innerHTML = '<strong>🎉 ¡Has completado todos los pasos de esta tarea!</strong><p>Progreso: 100%</p>';
    return;
  }
  const actividad = actividades[indice];
  contenedor.innerHTML = `<p class="eyebrow">PASO ${indice + 1} DE ${actividades.length}</p><h3>${escapar(actividad.titulo || actividad.nombre || 'Actividad')}</h3>${actividad.descripcion ? `<p>${escapar(actividad.descripcion)}</p>` : ''}${actividad.duracion != null || actividad.duracion_minutos != null ? `<small>Duración: ${escapar(actividad.duracion ?? actividad.duracion_minutos)} minutos</small>` : ''}${actividad.metodo_estudio || planSeleccionado.metodo_estudio ? `<small>Método: ${escapar(actividad.metodo_estudio || planSeleccionado.metodo_estudio)}</small>` : ''}<p>El estado se actualiza al completar el plan completo.</p>`;
}

function estaCompletada(actividad) {
  return Boolean(actividad.completada ?? actividad.completed ?? ['completada', 'completado', 'realizada', 'realizado', 'completed'].includes(String(actividad.estado || '').toLowerCase()));
}

function renderizarCompletarTarea(plan) {
  const contenedor = document.getElementById('contenedor-completar-tarea');
  if (!contenedor) return;
  const planId = plan?.id;
  const completada = estaTareaCompletada(planId);
  contenedor.hidden = false;
  const totalPasos = Array.isArray(plan?.actividades) ? plan.actividades.length : 0;
  const pasosCompletos = todosLosPasosCompletados(planId, totalPasos);
  contenedor.innerHTML = `<span class="estado-plan ${completada ? 'completada' : ''}">${completada ? '✅ Completada' : 'Pendiente'}</span><button type="button" class="btn-completar-tarea" id="btn-completar-tarea-historial" ${planId && pasosCompletos && !completada ? '' : 'disabled'}>${completada ? '✅ Tarea completada' : '✅ Completar tarea'}</button>${!completada && !pasosCompletos ? '<small>Completa todos los pasos para finalizar la tarea.</small>' : ''}`;
  document.getElementById('btn-completar-tarea-historial')?.addEventListener('click', () => completarTareaGeneral(plan));
}

function completarTareaGeneral(plan) {
  const boton = document.getElementById('btn-completar-tarea-historial');
  if (!plan?.id || estaTareaCompletada(plan.id) || !boton || boton.disabled) return;
  boton.disabled = true;
  boton.textContent = 'Guardando...';
  completarTareaLocal(plan.id);
  renderizarCompletarTarea(plan);
}