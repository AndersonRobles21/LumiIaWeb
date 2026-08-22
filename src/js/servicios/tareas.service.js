/**
 * tareas.service.js
 * Servicio de tareas y actividades
 * 
 * Schema real:
 * - public.planes_estudio
 * - public.actividades  (pertenecen a un plan)
 * - public.tareas       (pertenecen a una actividad)
 * 
 * Campos principales de tareas:
 * - id (uuid)
 * - actividad_id (uuid)
 * - titulo
 * - descripcion
 * - completada (boolean)
 */

import { apiGet, apiPut } from '../api.js';

/**
 * Obtener todas las tareas de un usuario
 * (a través de sus planes → actividades → tareas)
 */
export async function obtenerTareasDelUsuario(usuarioId) {
  const respuesta = await apiGet(`/tareas/${usuarioId}`);
  const tareas = respuesta?.tareas || [];
  return tareas.map(tarea => ({
    ...tarea,
    nombre: tarea.nombre ?? tarea.titulo ?? '',
    descripcion: tarea.descripcion ?? '',
    estado: tarea.estado ?? (tarea.completada ? 'completada' : 'pendiente'),
    fecha_creacion: tarea.fecha_creacion ?? null,
    fecha_entrega: tarea.fecha_entrega ?? null,
    completada: Boolean(tarea.completada) || tarea.estado === 'COMPLETADA',
  }));
}

/**
 * Marcar tarea como completada / pendiente
 */
export async function actualizarEstadoTarea(tareaId, completada) {
  return apiPut(`/tareas/${tareaId}/completar`, { completada });
}

/**
 * Actualizar datos de una tarea
 */
