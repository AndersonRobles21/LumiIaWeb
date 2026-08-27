import { supabase } from '../config/supabase.js';
import { marcarPlanCompletadoBD, obtenerPlanesUsuarioBD, reabrirPlanBD } from '../servicios/planes.service.js';
import { obtenerUsuarioActual } from '../servicios/autenticacion.service.js';
import { obtenerHistorialIA, obtenerPlanIA } from '../servicios/ia.service.js';
import { actualizarEstadoTarea } from '../servicios/tareas.service.js';
import { completarPaso, completarPlan, estaPasoCompletado, obtenerPasosCompletados, obtenerProgresoTareas, reiniciarProgresoPlan, todosLosPasosCompletados } from '../utilidades/progreso-tareas.js?v=reinicio-plan';

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

    const planesIA = await obtenerHistorialIA(usuarioId);
    const planesBD = await obtenerPlanesUsuarioBD(usuarioId);
    const actividadIds = planesBD.flatMap(plan => (plan.actividades || []).map(actividad => actividad.id)).filter(Boolean);
    let tareas = [];
    if (actividadIds.length > 0) {
      const { data, error } = await supabase
        .from('tareas')
        .select('id, actividad_id, completada, titulo, descripcion')
        .in('actividad_id', actividadIds);
      if (error) throw error;
      tareas = data || [];
    }
    planesBD.forEach(plan => (plan.actividades || []).forEach(actividad => {
      actividad.tareas = tareas.filter(tarea => tarea.actividad_id === actividad.id);
    }));
    listaPlanesGlobal = deduplicarPlanes(planesIA.map(planIA => ({
      ...planIA,
      planBD: planesBD.find(plan => String(plan.id) === String(planIA.id)) || null,
    })), usuarioId);

    if (listaPlanesGlobal.length > 0) {
      renderizarListaPlanes(listaPlanesGlobal, contenedorLista);
      const planIdSolicitado = new URLSearchParams(window.location.search).get('plan_id');
      console.log('plan_id recibido desde URL:', planIdSolicitado);
      console.log('IDs de planes devueltos por el historial IA:', listaPlanesGlobal.map(plan => plan.id));
      if (planIdSolicitado) {
        const planSolicitado = listaPlanesGlobal.find(plan => String(plan.id) === String(planIdSolicitado));
        if (!planSolicitado) {
          contenedorLista.innerHTML = '<p class="ia-error">El plan solicitado no existe en el historial</p>';
          return;
        }
        await seleccionarPlan(planSolicitado);
      } else {
        await seleccionarPlan(listaPlanesGlobal[0]);
      }
    } else {
      contenedorLista.innerHTML = `<p style="padding: 1rem; color: #8a8f9d;">No tienes tareas registradas en la base de datos.</p>`;
    }

  } catch (error) {
    console.error('Error al cargar historial desde Supabase:', error);
    contenedorLista.innerHTML = `<p style="padding: 1rem; color: #8a8f9d;">Error al sincronizar con la base de datos.</p>`;
  }
}

function deduplicarPlanes(planes, usuarioId) {
  const grupos = new Map();
  (Array.isArray(planes) ? planes : []).forEach(plan => {
    const clave = obtenerClavePlan(plan, usuarioId);
    const existente = grupos.get(clave);
    if (!existente || tieneDetalleIA(plan)) grupos.set(clave, plan);
  });
  return [...grupos.values()];
}

function obtenerClavePlan(plan, usuarioId) {
  const nombre = normalizarClave(plan?.nombre || plan?.titulo);
  const descripcion = normalizarClave(plan?.descripcion);
  return `plan:${usuarioId}:${nombre}:${descripcion}`;
}

function tieneDetalleIA(plan) {
  return Boolean(plan?.metodo_estudio || plan?.tiempo_estimado_total || plan?.resumen_final);
}

function normalizarClave(valor) {
  return String(valor ?? '').trim().toLowerCase().replace(/\s+/g, ' ');
}

function renderizarListaPlanes(planes, contenedor) {
  contenedor.innerHTML = `<div class="grupo-fecha-label">Tus tareas guardadas</div>`;

  planes.forEach((plan, index) => {
    const esActiva = index === 0 ? 'activa' : '';
    const esCompletada = plan.completada || plan.estado === 'COMPLETADO' || obtenerProgresoTareas()[String(plan.id)]?.completada;
    const titulo = plan.nombre || 'Tarea sin nombre';
    const descripcion = plan.descripcion || 'Sin descripción';
    const hora = plan.fecha_creacion 
      ? new Date(plan.fecha_creacion).toLocaleDateString([], { month: 'short', day: 'numeric' })
      : 'Hoy';

    const itemHTML = `
      <div class="item-conversacion ${esActiva} ${esCompletada ? 'completada' : ''}" data-id="${escapar(plan.id)}" data-index="${index}">
        <img class="avatar-lumi-sm" src="../assets/chat_ia.png" alt="LUMI">
        <div class="info-conversacion">
          <h4>${escapar(titulo)}</h4>
          <p>${escapar(descripcion)}</p>
        </div>
        ${esCompletada ? '<span class="estado-conversacion-completada">Completada</span>' : ''}
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

async function seleccionarPlan(plan) {
  if (!plan?.id) return;
  planSeleccionado = plan;
  const contenedorPasos = document.getElementById('contenedor-pasos-historial');
  if (contenedorPasos) contenedorPasos.innerHTML = '<p class="ia-cargando">Cargando plan generado por IA...</p>';

  let detalle;
  try {
    detalle = await obtenerPlanIA(plan.id);
  } catch (error) {
    if (error.status === 404) {
      detalle = plan;
    } else {
      if (contenedorPasos) contenedorPasos.innerHTML = `<p class="ia-error">No se pudo cargar el detalle de IA: ${escapar(error.message)}</p>`;
      return;
    }
  }
  planSeleccionado = { ...plan, ...detalle, actividades: plan.planBD?.actividades || [] };
  plan = planSeleccionado;
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
  const contenedorDetalle = document.getElementById('contenedor-resumen-historial');

  if (elTitulo) elTitulo.textContent = plan.nombre || 'Plan de Estudio';
  const metodo = obtenerMetodoPlan(plan);
  if (elMetodo) elMetodo.textContent = metodo;
  actualizarImagenMetodo(metodo);
  
  if (elSaludo) {
    elSaludo.textContent = `¡Hola! Aquí tienes los detalles y actividades registradas para "${plan.nombre}". ¿Quieres repasar algún punto?`;
  }

  if (contenedorDetalle) {
    contenedorDetalle.hidden = false;
    contenedorDetalle.innerHTML = renderizarDetalleIA(plan);
  }

  if (elHora && plan.fecha_creacion) {
    elHora.textContent = new Date(plan.fecha_creacion).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  // Renderizar actividades y tareas asociadas de la base de datos
  if (contenedorPasos) {
    const actividades = Array.isArray(plan.pasos) && plan.pasos.length
      ? plan.pasos
      : plan.actividades || plan.fases || plan.tareas || [];
      if (actividades.length > 0) {
        renderizarPasosHistorial(plan, actividades, contenedorPasos);
    } else {
      contenedorPasos.innerHTML = `
        <div style="padding: 0.85rem; background: rgba(255,255,255,0.03); border-radius: 8px; font-size: 0.88rem; color: #b0b5c0;">
          <strong>Descripción registrada:</strong> ${escapar(plan.descripcion || 'Sin información adicional del plan.')}
        </div>
      `;
    }
  }
}

  function renderizarPasosHistorial(plan, actividades, contenedor) {
    const totalPasos = actividades.length;
    const completados = obtenerPasosCompletados(plan.id).length;
    const todosCompletados = todosLosPasosCompletados(plan.id, totalPasos);
    const planCompletado = Boolean(obtenerProgresoTareas()[String(plan.id)]?.completada);
    contenedor.innerHTML = `<p class="progreso-pasos">Progreso: ${completados}/${totalPasos} pasos</p>${actividades.map((actividad, indice) => {
      const completado = estaPasoCompletado(plan.id, indice + 1);
      const disponible = !completado && (indice === 0 || estaPasoCompletado(plan.id, indice));
      const contenido = actividad.descripcion || actividad.contenido || actividad.detalle;
      const tareas = Array.isArray(actividad.tareas) ? actividad.tareas : [];
      const subpasos = Array.isArray(actividad.subpasos) ? actividad.subpasos : actividad.subtareas;
      const subpasosHTML = renderizarSubpasos(subpasos);
      const tareasHTML = tareas.map(tarea => `<div class="tarea-backend-control"><span>${escapar(tarea.titulo)}</span><button type="button" class="btn-completar-tarea" data-tarea-id="${escapar(tarea.id)}" data-completada="${tarea.completada}">${tarea.completada ? 'Completada' : 'Completar tarea'}</button></div>`).join('');
      return `<article class="paso-ia ${completado ? 'completado' : disponible ? 'disponible' : 'bloqueado'}"><strong>${completado ? 'OK' : disponible ? indice + 1 : 'Bloqueado'} PASO ${actividad.numero || indice + 1}: ${escapar(actividad.titulo || actividad.nombre || `Fase ${indice + 1}`)}</strong>${contenido ? `<p>${escapar(contenido)}</p>` : '<p>Sin descripción disponible</p>'}${subpasosHTML}${completado ? '<span class="paso-mensaje">Paso completado</span>' : disponible ? `<button type="button" class="btn-confirmar-paso" data-paso="${indice + 1}">Confirmar paso</button>` : '<span class="paso-mensaje">Completa el paso anterior</span>'}${tareasHTML}</article>`;
    }).join('')}${todosCompletados ? `<button type="button" class="btn-completar-plan${planCompletado ? ' guardado' : ''}"${planCompletado ? ' disabled' : ''}>${planCompletado ? 'Tareas completadas' : 'Completar tareas'}</button>` : ''}`;
    contenedor.querySelectorAll('.btn-confirmar-paso').forEach(boton => boton.addEventListener('click', () => {
      const numeroPaso = Number(boton.dataset.paso);
      if (completarPaso(plan.id, numeroPaso)) seleccionarPlan(plan);
    }));
    contenedor.querySelectorAll('[data-tarea-id]').forEach(boton => boton.addEventListener('click', async () => {
      const tarea = actividades.flatMap(actividad => actividad.tareas || []).find(item => String(item.id) === boton.dataset.tareaId);
      if (!tarea || boton.disabled) return;
      boton.disabled = true;
      try {
        const completada = !tarea.completada;
        await actualizarEstadoTarea(tarea.id, completada);
        tarea.completada = completada;
        seleccionarPlan(plan);
      } catch (error) {
        boton.disabled = false;
        alert(`No se pudo actualizar la tarea: ${error.message}`);
      }
    }));
      contenedor.querySelector('.btn-completar-plan')?.addEventListener('click', async () => {
        try {
          await marcarPlanCompletadoBD(plan.id);
          if (completarPlan(plan.id)) seleccionarPlan(plan);
        } catch (error) {
          alert(`No se pudo guardar la tarea completada: ${error.message}`);
        }
      });
  }

function renderizarSubpasos(subpasos) {
  if (!Array.isArray(subpasos) || subpasos.length === 0) return '';
  return `<div class="ia-subpasos"><strong>Subpasos</strong><ul>${subpasos.map(subpaso => {
    const texto = subpaso?.texto || subpaso?.titulo || subpaso?.descripcion || subpaso;
    const completado = Boolean(subpaso?.completado ?? subpaso?.completada);
    return `<li class="${completado ? 'completado' : ''}"><span>${completado ? 'OK' : '-'}</span>${escapar(texto)}</li>`;
  }).join('')}</ul></div>`;
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
  const botonReiniciar = document.getElementById('btn-reiniciar-pasos-historial');
  botonReiniciar?.addEventListener('click', async () => {
    if (!planSeleccionado?.id || !confirm('¿Reiniciar el progreso de los pasos de esta tarea?')) return;
    try {
      await reabrirPlanBD(planSeleccionado.id);
    } catch (error) {
      alert(`No se pudo reiniciar la tarea: ${error.message}`);
      return;
    }
    reiniciarProgresoPlan(planSeleccionado.id);
    seleccionarPlan(planSeleccionado);
  });
  [botonRayo, botonCambiar].forEach(boton => boton?.addEventListener('click', () => {
    if (!planSeleccionado?.id) return;
    const metodo = obtenerMetodoPlan(planSeleccionado);
    const modo = boton === botonRayo ? '&modo=interactivo' : '';
    const destino = boton === botonRayo ? `${obtenerRutaMetodo(metodo)}.html` : 'metodos.html';
    window.location.href = `${destino}?plan_id=${encodeURIComponent(planSeleccionado.id)}&metodo=${encodeURIComponent(metodo)}${modo}`;
  }));
}

function obtenerMetodoPlan(plan) {
  return localStorage.getItem(`lumi_metodo_plan_${plan?.id}`) || plan?.metodo_estudio || 'Pomodoro';
}

function obtenerRutaMetodo(metodo) {
  const clave = String(metodo).toLowerCase();
  if (clave.includes('feyn')) return 'metodo-feynman';
  if (clave.includes('recall')) return 'metodo-active-recall';
  if (clave.includes('spaced') || clave.includes('repetition')) return 'metodo-spaced-repetition';
  return 'metodo-pomodoro';
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
  const actividades = planSeleccionado.pasos || planSeleccionado.actividades || [];
  const pasosVisibles = document.getElementById('contenedor-pasos-historial');
  if (pasosVisibles) pasosVisibles.hidden = true;
  const indice = actividades.findIndex((actividad, indiceActividad) => !estaPasoCompletado(planSeleccionado.id, indiceActividad + 1) && !estaCompletada(actividad));
  contenedor.hidden = false;
  if (indice === -1) {
    contenedor.innerHTML = '<strong>Has completado todos los pasos de esta tarea.</strong><p>Progreso: 100%</p><button type="button" class="btn-completar-plan">Completar tareas</button>';
    contenedor.querySelector('.btn-completar-plan')?.addEventListener('click', () => {
      if (completarPlan(planSeleccionado.id)) seleccionarPlan(planSeleccionado);
    });
    return;
  }
  const actividad = actividades[indice];
  contenedor.innerHTML = `<p class="eyebrow">PASO ${indice + 1} DE ${actividades.length}</p><h3>${escapar(actividad.titulo || actividad.nombre || 'Actividad')}</h3>${actividad.descripcion ? `<p>${escapar(actividad.descripcion)}</p>` : ''}${actividad.duracion != null || actividad.duracion_minutos != null ? `<small>Duración: ${escapar(actividad.duracion ?? actividad.duracion_minutos)} minutos</small>` : ''}${actividad.metodo_estudio || planSeleccionado.metodo_estudio ? `<small>Método: ${escapar(actividad.metodo_estudio || planSeleccionado.metodo_estudio)}</small>` : ''}<p>Confirma este paso para continuar con el siguiente.</p><button type="button" class="btn-confirmar-paso" data-paso="${indice + 1}">Completar paso</button>`;
  contenedor.querySelector('.btn-confirmar-paso')?.addEventListener('click', () => {
    if (completarPaso(planSeleccionado.id, indice + 1)) renderizarPasoPendiente();
  });
}

function estaCompletada(actividad) {
  return Boolean(actividad.completada ?? actividad.completed ?? ['completada', 'completado', 'realizada', 'realizado', 'completed'].includes(String(actividad.estado || '').toLowerCase()));
}

function actualizarImagenMetodo(metodo) {
  const imagen = document.getElementById('imagen-metodo-activo');
  if (!imagen) return;
  const clave = String(metodo).toLowerCase();
  const metodos = clave.includes('feyn') ? ['feyman.png', 'Feynman']
    : clave.includes('active') || clave.includes('recall') ? ['active_recall.png', 'Active Recall']
      : clave.includes('spaced') || clave.includes('repetition') ? ['spaced_repetition.png', 'Spaced Repetition']
        : ['pomodoro.png', 'Pomodoro'];
  imagen.src = `../assets/${metodos[0]}`;
  imagen.alt = metodos[1];
}

function renderizarDetalleIA(plan) {
  const consejos = renderizarListaIA(plan.consejos, 'No hay consejos disponibles.');
  const recursos = renderizarListaIA(plan.recursos, 'No hay recursos disponibles.');
  const conceptos = renderizarListaIA(plan.conceptos_clave, 'No hay conceptos clave disponibles.');
  const preguntas = renderizarListaIA(plan.preguntas_recall, 'No hay preguntas de Active Recall disponibles.');
  return `<div class="ia-detalle-grid">
    <section class="ia-bloque ia-identidad"><h3>${escapar(plan.nombre || 'Plan de estudio')}</h3><p>${escapar(plan.descripcion || 'Sin descripción disponible.')}</p></section>
    <section class="ia-bloque"><strong>Método de estudio</strong><p>${escapar(plan.metodo_estudio || 'No especificado')}</p><strong>Justificación</strong><p>${escapar(plan.justificacion || 'No disponible')}</p></section>
    <section class="ia-bloque ia-tiempo"><strong>Tiempo estimado</strong><p>${plan.tiempo_estimado_total != null ? `${escapar(plan.tiempo_estimado_total)} minutos` : 'No disponible'}</p><strong>Dificultad</strong><p>${escapar(plan.dificultad || 'No especificada')}</p><strong>Fecha de entrega</strong><p>${escapar(plan.fecha_entrega || 'No disponible')}</p></section>
    <section class="ia-bloque"><strong>Resumen final</strong><p>${escapar(plan.resumen_final || 'No hay resumen disponible.')}</p></section>
    <section class="ia-bloque"><strong>Consejos</strong>${consejos}</section>
    <section class="ia-bloque"><strong>Recursos</strong>${recursos}</section>
    <section class="ia-bloque"><strong>Conceptos clave</strong>${conceptos}</section>
    <section class="ia-bloque"><strong>Preguntas de Active Recall</strong>${preguntas}</section>
  </div>`;
}

function renderizarListaIA(valores, vacio) {
  if (!Array.isArray(valores) || valores.length === 0) return `<p class="ia-vacio">${vacio}</p>`;
  return `<ul class="ia-lista">${valores.map(valor => `<li>${escapar(typeof valor === 'object' ? valor.texto || valor.nombre || valor.titulo || JSON.stringify(valor) : valor)}</li>`).join('')}</ul>`;
}