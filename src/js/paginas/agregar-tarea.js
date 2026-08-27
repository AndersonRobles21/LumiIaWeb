import { obtenerUsuarioActual } from '../servicios/autenticacion.service.js';
import { obtenerUsuarioConPerfil } from '../servicios/usuario.service.js';
import { generarPlanIA } from '../servicios/ia.service.js';
import { crearPlanEstudioBD } from '../servicios/planes.service.js';
import { crearTarea } from '../servicios/tareas.service.js';

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('formulario-tarea');
  if (!form) return;

  const fechaInput = document.getElementById('fecha');
  if (fechaInput) {
    const hoy = obtenerFechaLocal();
    fechaInput.min = hoy;
    fechaInput.addEventListener('change', () => {
      const esPasada = fechaInput.value && fechaInput.value < hoy;
      fechaInput.setCustomValidity(esPasada ? 'Selecciona una fecha de hoy o posterior.' : '');
      fechaInput.classList.toggle('campo-invalido', Boolean(esPasada));
    });
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    validarYGuardar();
  });
});

async function validarYGuardar() {
  const btnGuardar = document.querySelector('#formulario-tarea button[type="submit"]');
  let etapa = 'validación';

  if (btnGuardar && btnGuardar.disabled) return;
  if (btnGuardar) {
    btnGuardar.disabled = true;
    btnGuardar.textContent = 'Guardando en la nube...';
  }

  const tituloInput = document.getElementById('titulo');
  const descripcionInput = document.getElementById('descripcion');
  const fechaInput = document.getElementById('fecha');
  const prioridadInput = document.getElementById('prioridad');

  const titulo = tituloInput?.value.trim();
  const descripcion = descripcionInput?.value.trim() || '';
  const fecha = fechaInput?.value;
  const prioridad = prioridadInput?.value || 'Media';
  const metodo = 'Sugerido por IA (LUMI)';

  if (!titulo || !fecha || fecha < obtenerFechaLocal()) {
    alert('Por favor completa el título y la fecha límite.');
    if (btnGuardar) { 
      btnGuardar.disabled = false; 
      btnGuardar.textContent = 'Generar cronograma'; 
    }
    return;
  }

  try {
    // 1. Obtener usuario autenticado
    const usuario = await obtenerUsuarioActual();
    
    if (!usuario?.id) {
      alert('Debes iniciar sesión para guardar tus tareas.');
      window.location.href = 'login.html';
      return;
    }

    let horasDisponibles = 0;
    try {
      const respuestaPerfil = await obtenerUsuarioConPerfil(usuario.id);
      const datosPerfil = respuestaPerfil?.data || respuestaPerfil || {};
      const perfil = datosPerfil.perfil_estudio || datosPerfil.perfil || {};
      horasDisponibles = Number(perfil.horas_disponibles ?? datosPerfil.horas_disponibles ?? 0);
    } catch (error) {
      console.warn('No se pudo recuperar la disponibilidad del perfil:', error.message);
      try {
        const horariosGuardados = JSON.parse(localStorage.getItem('lumi_horarios_estudio') || '{}');
        horasDisponibles = (horariosGuardados.horarios || []).reduce((total, horario) => {
          const inicio = minutosDesdeMedianoche(horario.hora_inicio);
          const fin = minutosDesdeMedianoche(horario.hora_fin);
          return total + (fin > inicio ? (fin - inicio) / 60 : 0);
        }, 0);
      } catch {
        horasDisponibles = 0;
      }
    }
    const diasDisponibles = calcularDiasHasta(fecha);

    // 2. Persistir permanentemente en Supabase (Tablas: planes_estudio y actividades)
    const registroBD = await crearPlanEstudioBD({
      usuario_id: usuario.id,
      titulo,
      descripcion,
      fecha_entrega: fecha,
      estado: 'ACTIVO'
    });

    etapa = 'tarea';
    console.log('Tarea guardada exitosamente en Supabase:', registroBD);

    const tarea = await crearTarea({
      nombre: titulo,
      descripcion,
      completada: false,
      actividad_id: registroBD.actividad.id,
      usuario_id: usuario.id,
    });
    if (!tarea?.id) throw new Error('El backend no devolvió el ID de la tarea creada.');

    // 3. Solicitar plan a la IA
    etapa = 'IA';
    if (btnGuardar) btnGuardar.textContent = 'Generando plan con IA...';

    const respuestaIA = await generarPlanIA({
      usuario_id: usuario.id,
      plan_id: registroBD.plan.id,
      nombre: titulo,
      descripcion,
      fecha_entrega: fecha,
      metodo_estudio: metodo,
      dificultad: prioridad,
      horas_disponibles: horasDisponibles,
      dias_disponibles: diasDisponibles,
      minutos_disponibles: horasDisponibles * 60 * diasDisponibles
    });

    console.log('respuestaIA.plan_id:', respuestaIA?.plan_id);
    if (!respuestaIA?.plan_id) throw new Error('La IA no devolvió un plan_id válido.');
    const urlHistorial = `historial.html?plan_id=${encodeURIComponent(respuestaIA.plan_id)}`;
    window.location.href = urlHistorial;
  } catch (error) {
    console.error('Fallo en el proceso de guardado o IA:', error);
    const errorIA = typeof error.message === 'string' && error.message.includes('gemini-1.5-flash')
      ? 'El modelo de IA configurado en el backend ya no está disponible. Actualiza Gemini a un modelo vigente.'
      : error.message;
    const mensaje = etapa === 'IA'
      ? `La tarea se guardó, pero no se pudo generar el plan con IA: ${errorIA}`
      : `No se pudo guardar la tarea: ${error.message}`;
    alert(mensaje);
    if (btnGuardar) {
      btnGuardar.disabled = false;
      btnGuardar.textContent = 'Generar cronograma';
    }
  }
}

function obtenerFechaLocal() {
  const fecha = new Date();
  const año = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  return `${año}-${mes}-${dia}`;
}

function calcularDiasHasta(fechaEntrega) {
  const hoy = new Date(`${obtenerFechaLocal()}T00:00:00`);
  const entrega = new Date(`${fechaEntrega}T00:00:00`);
  const diferencia = Math.ceil((entrega - hoy) / 86400000) + 1;
  return Math.max(1, diferencia);
}

function minutosDesdeMedianoche(hora) {
  const [horas, minutos] = String(hora || '').split(':').map(Number);
  return Number.isFinite(horas) && Number.isFinite(minutos) ? horas * 60 + minutos : 0;
}