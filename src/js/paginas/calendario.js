/**
 * calendario.js
 * Visualización del mes, lectura de tareas locales y renderizado del timeline.
 */

let fechaSeleccionada = new Date();
let tareasGuardadas = [];

document.addEventListener('DOMContentLoaded', () => {
  inicializarCalendario();
});

function inicializarCalendario() {
  cargarTareasLocalStorage();
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
  const fechaStr = tarea.fecha || tarea.fecha_entrega || tarea.fecha_limite || tarea.created_at || '';
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

function normalizarCategoria(cat) {
  if (!cat) return 'entrega';
  const c = String(cat).toLowerCase();
  if (c.includes('examen') || c.includes('evaluacion') || c.includes('parcial')) return 'examen';
  if (c.includes('clase') || c.includes('estudio')) return 'clase';
  if (c.includes('proyecto') || c.includes('taller')) return 'proyecto';
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
        ${puntos ? `<div class="puntos-dia">${puntos}</div>` : ''}
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
    const cat = normalizarCategoria(tarea.categoria || tarea.prioridad);
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
  if (resumenTiempo) resumenTiempo.textContent = `${tareasDelDia.length * 1}h 0m`;

  if (tareasDelDia.length === 0) {
    contenedorTimeline.innerHTML = `
      <div class="tareas-vacio-cal">
        <p>No hay tareas ni exámenes programados para este día.</p>
      </div>`;
    return;
  }

  contenedorTimeline.innerHTML = tareasDelDia.map(tarea => {
    const cat = normalizarCategoria(tarea.categoria || tarea.prioridad);
    const hora = tarea.hora || '09:00 AM';

    return `
      <div class="timeline-item">
        <div class="hora-col">
          <span>${hora}</span>
        </div>
        <div class="linea-indicador ${cat}"></div>
        <div class="card-tarea-timeline">
          <div class="header-tarea-item">
            <h3>${tarea.titulo || 'Tarea sin título'}</h3>
            <span class="badge-cat ${cat}">${cat}</span>
          </div>
          ${tarea.descripcion ? `<p class="desc-tarea">${tarea.descripcion}</p>` : ''}
        </div>
      </div>
    `;
  }).join('');
}