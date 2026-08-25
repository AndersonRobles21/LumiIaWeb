/**
 * agregar-tarea.js
 * Lógica para agregar tarea con manejo de límite de cuota (Rate Limit / 429) y guardado resiliente.
 */

import { obtenerUsuarioActual } from '../servicios/autenticacion.service.js';
import { generarPlanIA } from '../servicios/ia.service.js';

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('formulario-tarea');

  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    validarYGuardar();
  });
});

async function validarYGuardar() {
  const tituloInput = document.getElementById('titulo');
  const descripcionInput = document.getElementById('descripcion');
  const fechaInput = document.getElementById('fecha');
  const prioridadInput = document.getElementById('prioridad');
  const estadoInput = document.getElementById('estado');
  const metodoInput = document.getElementById('metodo');
  const categoriaInput = document.getElementById('categoria'); // Captura de categoría si existe en HTML

  const titulo = tituloInput?.value.trim();
  const descripcion = descripcionInput?.value.trim() || '';
  const fecha = fechaInput?.value;
  const prioridad = prioridadInput?.value || 'Media';
  const estado = estadoInput?.value || 'Sin empezar';
  const metodo = metodoInput?.value || 'Sugerido por IA (LUMI)';
  
  // Categoría asignada (entrega, examen, clase, proyecto)
  const categoria = categoriaInput?.value || 'entrega'; 

  // Validaciones de UI
  if (!titulo) {
    alert('Por favor, ingresa el título de la tarea.');
    tituloInput?.focus();
    return;
  }

  if (!fecha) {
    alert('Por favor, selecciona una fecha límite.');
    fechaInput?.focus();
    return;
  }

  // Mapear estado a porcentaje para el Dashboard
  const mapaPorcentaje = {
    'Sin empezar': '0%',
    'En progreso': '40%',
    'Casi listo': '75%',
    'Completada': '100%'
  };
  const porcentaje = mapaPorcentaje[estado] || '0%';

  // Estructura local de la tarea
  const nuevaTarea = {
    id: 'tarea_' + Date.now(),
    titulo,
    descripcion,
    fecha: fecha,             // Para lectura directa en el calendario
    fecha_entrega: fecha,     // Compatibilidad con backend
    prioridad,
    categoria,                // Categoría para color del punto (entrega, examen, clase, proyecto)
    estado,
    porcentaje,
    metodo_estudio: metodo,
    completada: estado === 'Completada',
    creada_el: new Date().toISOString()
  };

  // 1. Guardar de forma inmediata en LocalStorage (Resguardo)
  const tareasLocales = JSON.parse(localStorage.getItem('lumi_tareas') || '[]');
  tareasLocales.unshift(nuevaTarea);
  localStorage.setItem('lumi_tareas', JSON.stringify(tareasLocales));

  // 2. Intentar llamar al backend con manejo silencioso de Rate Limit
  try {
    const usuario = await obtenerUsuarioActual();
    
    if (usuario?.id) {
      const respuesta = await generarPlanIA({
        usuario_id: usuario.id,
        nombre: titulo,
        descripcion,
        fecha_entrega: fecha,
        metodo_estudio: metodo,
        dificultad: prioridad,
      });

      if (respuesta?.plan_id) {
        window.location.href = `guia-detalle.html?plan_id=${encodeURIComponent(respuesta.plan_id)}`;
        return;
      }
    }
  } catch (error) {
    console.warn('La API de IA alcanzó el límite de cuota o no está disponible. Generando plan básico local...', error);
  }

  // 3. Notificación y redirección
  alert('¡Tarea creada con éxito!');
  window.location.href = 'dashboard.html';
}