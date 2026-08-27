import { obtenerUsuarioActual } from '../servicios/autenticacion.service.js';
import { generarPlanIA } from '../servicios/ia.service.js';
import { crearPlanEstudioBD } from '../servicios/planes.service.js';

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('formulario-tarea');
  if (!form) return;

  const fechaInput = document.getElementById('fecha');
  if (fechaInput) {
    const hoy = new Date().toISOString().split('T')[0];
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

  if (btnGuardar && btnGuardar.disabled) return;
  if (btnGuardar) {
    btnGuardar.disabled = true;
    btnGuardar.textContent = 'Guardando en la nube...';
  }

  const tituloInput = document.getElementById('titulo');
  const descripcionInput = document.getElementById('descripcion');
  const fechaInput = document.getElementById('fecha');
  const prioridadInput = document.getElementById('prioridad');
  const estadoInput = document.getElementById('estado');

  const titulo = tituloInput?.value.trim();
  const descripcion = descripcionInput?.value.trim() || '';
  const fecha = fechaInput?.value;
  const prioridad = prioridadInput?.value || 'Media';
  const estado = estadoInput?.value || 'Sin empezar';
  const metodo = 'Sugerido por IA (LUMI)';

  if (!titulo || !fecha) {
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

    // 2. Persistir permanentemente en Supabase (Tablas: planes_estudio y actividades)
    const registroBD = await crearPlanEstudioBD({
      usuario_id: usuario.id,
      titulo,
      descripcion,
      fecha_entrega: fecha,
      estado: 'ACTIVO'
    });

    console.log('Tarea guardada exitosamente en Supabase:', registroBD);

    // 3. Solicitar plan a la IA
    if (btnGuardar) btnGuardar.textContent = 'Generando plan con IA...';

    const respuestaIA = await generarPlanIA({
      usuario_id: usuario.id,
      plan_id: registroBD.plan.id,
      nombre: titulo,
      descripcion,
      fecha_entrega: fecha,
      metodo_estudio: metodo,
      dificultad: prioridad
    });

    if (respuestaIA?.plan_id) {
      window.location.href = `historial.html?plan_id=${encodeURIComponent(respuestaIA.plan_id)}`;
      return;
    }

  } catch (error) {
    console.error('Fallo en el proceso de guardado o IA:', error);
  }

  // Si la IA no respondió o falló la conexión al backend, notificar y redirigir
  alert('¡Tarea guardada en tu cuenta exitosamente!');
  window.location.href = 'dashboard.html';
}