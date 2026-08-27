/**
 * calendario.js
 * Visualización del mes y renderizado del timeline.
 */

import { obtenerUsuarioActual } from '../servicios/autenticacion.service.js';
import { obtenerUsuarioConPerfil } from '../servicios/usuario.service.js';
import { obtenerPlanesUsuarioBD } from '../servicios/planes.service.js';
import { estaTareaCompletada } from '../utilidades/progreso-tareas.js';

let fechaSeleccionada = new Date();
let tareasGuardadas = [];

document.addEventListener('DOMContentLoaded', async () => {
  await cargarDisponibilidad();
  await cargarTareasPersistentes();
  inicializarCalendario();
});

async function cargarTareasPersistentes() {
  try {
    const usuario = await obtenerUsuarioActual();
    if (!usuario?.id) throw new Error('Sin sesión');
    const planes = await obtenerPlanesUsuarioBD(usuario.id);
    tareasGuardadas = normalizarPlanesCalendario(planes);
  } catch {
    cargarTareasLocalStorage();
  }
}

function normalizarPlanesCalendario(planes) {
  const entradas = [];
  (Array.isArray(planes) ? planes : []).forEach(plan => {
    const actividades = Array.isArray(plan.actividades) ? plan.actividades : [];
    const completadaLocal = estaTareaCompletada(plan.id);
    const fechas = actividades.filter(actividad => actividad.fecha).map(actividad => ({ ...actividad, plan_id: plan.id, titulo: actividad.titulo || plan.nombre, fechaCalendario: actividad.fecha, completadaLocal }));
    const fechaPlan = plan.fecha_entrega || plan.fecha_fin || plan.fecha;
    if (fechaPlan && !fechas.some(actividad => String(actividad.fechaCalendario).split('T')[0] === String(fechaPlan).split('T')[0])) {
      fechas.push({ ...plan, titulo: plan.nombre || plan.titulo, plan_id: plan.id, fechaCalendario: fechaPlan, completadaLocal });
    }
    entradas.push(...fechas);
  });
  return entradas;
}

async function cargarDisponibilidad() {
  try {
    const usuario = await obtenerUsuarioActual();
    if (!usuario?.id) throw new Error('Sin sesión');
    const respuesta = await obtenerUsuarioConPerfil(usuario.id);
    const datos = respuesta?.data || respuesta || {};
    const perfil = datos.perfil || datos.perfil_estudio || {};
    const horarios = datos.horarios || perfil.horarios || perfil.horario || [];
    if (Array.isArray(horarios) && horarios.length > 0) {
      localStorage.setItem('lumi_horarios_estudio', JSON.stringify({ dias: obtenerDiasDisponibles(horarios), horarios }));
    }
  } catch {
    // Mantener el último respaldo local si el backend no responde.
  }
}

function obtenerDiasDisponibles(horarios) {
  const nombres = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
  return [...new Set((Array.isArray(horarios) ? horarios : []).map(horario => {
    if (Number.isInteger(Number(horario.dia_semana))) return Number(horario.dia_semana);
    return nombres.indexOf(horario.dia);
  }).filter(indice => indice >= 0))];
}

function inicializarCalendario() {
  configurarBotonesNavegacion();
  renderizarCalendario();
  renderizarTimelineDia(fechaSeleccionada);
}

function cargarTareasLocalStorage() {
  try {
    const data = localStorage.getItem('lumi_tareas') || localStorage.getItem('tareas') || '[]';
    tareasGuardadas = JSON.parse(data);
  } catch (e) {
    tareasGuardadas = [];
  }
}

function configurarBotonesNavegacion() {
  const btnPrev = document.getElementById('btn-mes-prev');
  const btnNext = document.getElementById('btn-mes-next');

  if (btnPrev) {
    btnPrev.addEventListener('click', () => {
      fechaSeleccionada.setMonth(fechaSeleccionada.getMonth() - 1);
      renderizarCalendario();
    });
  }

  if (btnNext) {
    btnNext.addEventListener('click', () => {
      fechaSeleccionada.setMonth(fechaSeleccionada.getMonth() + 1);
      renderizarCalendario();
    });
  }
}

function construirFechaISO(anio, mes, dia) {
  return `${anio}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
}

// Función robusta para verificar si una tarea pertenece a un día específico del calendario
function tareaCorrespondeADia(tarea, anio, mes, dia) {
  // Buscar cualquier campo de fecha disponible en el objeto de la tarea
  const fechaStr = tarea.fechaCalendario || tarea.fecha || tarea.fecha_entrega || tarea.fecha_limite || tarea.created_at || '';
  if (!fechaStr) return false;

  // Extraer solamente la parte YYYY-MM-DD independientemente de si incluye hora o formato UTC
  const parteFecha = String(fechaStr).split('T')[0];
  const fechaEsperada = construirFechaISO(anio, mes, dia);

  return parteFecha === fechaEsperada;
}

function obtenerIndiceDiaSemana(anio, mes, dia) {
  const fecha = new Date(anio, mes - 1, dia);
  const diaSemana = fecha.getDay();
  return diaSemana === 0 ? 6 : diaSemana - 1;
}

function normalizarCategoria(evento) {
  const texto = typeof evento === 'object'
    ? [evento.titulo, evento.nombre, evento.descripcion, evento.detalle, evento.categoria, evento.tipo, evento.prioridad].filter(Boolean).join(' ')
    : evento;
  if (!texto) return 'entrega';
  const c = String(texto).toLocaleLowerCase('es');
  if (c.includes('examen') || c.includes('evaluacion') || c.includes('evaluación') || c.includes('prueba') || c.includes('parcial')) return 'examen';
  if (c.includes('proyecto')) return 'proyecto';
  if (c.includes('clase') || c.includes('estudio')) return 'clase';
  if (c.includes('taller')) return 'proyecto';
  return 'entrega';
}

function renderizarCalendario() {
  const gridDias = document.getElementById('grid-dias-mes');
  const labelMesAnio = document.getElementById('mes-anio-label');

  if (!gridDias || !labelMesAnio) return;

  const anio = fechaSeleccionada.getFullYear();
  const mes = fechaSeleccionada.getMonth();

  const nombreMes = fechaSeleccionada.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
  labelMesAnio.textContent = nombreMes.charAt(0).toUpperCase() + nombreMes.slice(1);

  const primerDiaIndex = new Date(anio, mes, 1).getDay();
  const inicioLunes = primerDiaIndex === 0 ? 6 : primerDiaIndex - 1;
  const diasEnMes = new Date(anio, mes + 1, 0).getDate();
  const diasEnMesPrevio = new Date(anio, mes, 0).getDate();

  let diasEstudioGuardados = [];
  try {
    const configHorarios = JSON.parse(localStorage.getItem('lumi_horarios_estudio') || '{"dias":[]}');
    diasEstudioGuardados = configHorarios.dias || [];
  } catch (e) {
    diasEstudioGuardados = [];
  }

  let html = '';

  for (let i = inicioLunes; i > 0; i--) {
    html += `<div class="dia-cell inactivo">${diasEnMesPrevio - i + 1}</div>`;
  }

  const hoy = new Date();
  for (let dia = 1; dia <= diasEnMes; dia++) {
    // Filtrar tareas usando la función robusta (mes + 1 porque getMonth() va de 0 a 11)
    const tareasDelDia = tareasGuardadas.filter(t => tareaCorrespondeADia(t, anio, mes + 1, dia));
    
    const indiceDiaSemana = obtenerIndiceDiaSemana(anio, mes + 1, dia);
    const esDiaEstudioPerfil = diasEstudioGuardados.includes(indiceDiaSemana);

    const esHoy = (hoy.getDate() === dia && hoy.getMonth() === mes && hoy.getFullYear() === anio);
    const esSeleccionado = (dia === fechaSeleccionada.getDate()) ? 'seleccionado' : '';
    
    const puntos = generarPuntosCategorias(tareasDelDia, esDiaEstudioPerfil);

    html += `
      <div class="dia-cell ${esSeleccionado} ${esHoy ? 'dia-hoy' : ''}" data-dia="${dia}">
        <span>${dia}</span>
        ${puntos ? `<div class="puntos-dia">${puntos}<small>${tareasDelDia.length} tarea${tareasDelDia.length === 1 ? '' : 's'}</small></div>` : ''}
      </div>
    `;
  }

  gridDias.innerHTML = html;

  gridDias.querySelectorAll('.dia-cell:not(.inactivo)').forEach(el => {
    el.addEventListener('click', () => {
      const diaNum = parseInt(el.dataset.dia, 10);
      fechaSeleccionada.setDate(diaNum);
      renderizarCalendario();
      renderizarTimelineDia(fechaSeleccionada);
    });
  });
}

function generarPuntosCategorias(tareas, esDiaEstudioPerfil) {
  const categorias = new Set();

  if (esDiaEstudioPerfil) {
    categorias.add('clase'); // Punto azul
  }

  tareas.forEach(tarea => {
    const cat = normalizarCategoria(tarea);
    categorias.add(cat);
  });

  if (categorias.size === 0) return '';

  return Array.from(categorias)
    .map(c => `<span class="punto-categoria ${c}"></span>`)
    .join('');
}

function renderizarTimelineDia(fecha) {
  const tituloDia = document.getElementById('titulo-dia-seleccionado');
  const contenedorTimeline = document.getElementById('contenedor-timeline');
  const cantTareas = document.getElementById('resumen-cant-tareas');
  const resumenTiempo = document.getElementById('resumen-tiempo');

  if (!tituloDia || !contenedorTimeline) return;

  const anio = fecha.getFullYear();
  const mes = fecha.getMonth() + 1;
  const diaNum = fecha.getDate();

  const fechaTexto = fecha.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
  tituloDia.textContent = fechaTexto.charAt(0).toUpperCase() + fechaTexto.slice(1);

  // Filtrar tareas correspondientes al timeline del día seleccionado
  const tareasDelDia = tareasGuardadas.filter(t => tareaCorrespondeADia(t, anio, mes, diaNum));

  if (cantTareas) cantTareas.textContent = tareasDelDia.length;
  const minutos = tareasDelDia.map(tarea => Number(tarea.duracion ?? tarea.duracion_minutos)).filter(Number.isFinite).reduce((total, valor) => total + valor, 0);
  if (resumenTiempo) resumenTiempo.textContent = minutos ? `${Math.floor(minutos / 60)}h ${minutos % 60}m` : 'No disponible';

  if (tareasDelDia.length === 0) {
    contenedorTimeline.innerHTML = `
      <div class="tareas-vacio-cal">
        <p>No hay tareas ni exámenes programados para este día.</p>
      </div>`;
    return;
  }

  contenedorTimeline.innerHTML = tareasDelDia.map(tarea => {
    const cat = normalizarCategoria(tarea);
    const hora = tarea.hora || '09:00 AM';

    return `
      <div class="timeline-item ${String(tarea.estado || '').toLowerCase()} ${tarea.completadaLocal ? 'completada' : ''}" data-plan-id="${tarea.plan_id || tarea.id || ''}">
        <div class="hora-col">
          <span>${hora}</span>
        </div>
        <div class="linea-indicador ${cat}"></div>
        <div class="card-tarea-timeline">
          <div class="header-tarea-item">
            <h3>${(tarea.plan_id || tarea.id) ? `<a href="historial.html?plan_id=${encodeURIComponent(tarea.plan_id || tarea.id)}">${escapar(tarea.titulo || tarea.nombre || 'Tarea sin título')}</a>` : escapar(tarea.titulo || tarea.nombre || 'Tarea sin título')}</h3>
            <span class="badge-cat ${cat}">${escapar(cat)}</span>
          </div>
          ${tarea.descripcion ? `<p class="desc-tarea">${escapar(tarea.descripcion)}</p>` : ''}
        </div>
      </div>
    `;
  }).join('');
}

function escapar(valor) {
  return String(valor).replace(/[&<>"']/g, caracter => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[caracter]);
}