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

import { apiDelete, apiGet, apiPost, apiPut } from '../api.js';

function obtenerTareaRespuesta(respuesta) {
  return respuesta?.tarea || respuesta?.data || respuesta;
}

export async function crearTarea({ nombre, descripcion = '', completada = false, actividad_id, usuario_id }) {
  const respuesta = await apiPost('/tareas', {
    nombre,
    descripcion,
    completada,
    actividad_id,
    usuario_id,
  });
  return obtenerTareaRespuesta(respuesta);
}

/**
 * Obtener todas las tareas de un usuario
 * (a través de sus planes → actividades → tareas)
 */
export async function obtenerTareasDelUsuario(usuarioId) {
  const respuesta = await apiGet(`/tareas/${usuarioId}`);
  const tareas = respuesta?.tareas || [];
  return tareas.map(tarea => ({
    ...tarea,
    titulo: tarea.titulo ?? tarea.nombre ?? '',
    nombre: tarea.titulo ?? tarea.nombre ?? '',
    descripcion: tarea.descripcion ?? '',
    completada: Boolean(tarea.completada),
  }));
}

/**
 * Marcar tarea como completada / pendiente
 */
export async function actualizarEstadoTarea(tareaId, completada) {
  return apiPut(`/tareas/${tareaId}/completar`, { completada });
}

export function obtenerDetalleTarea(tareaId) {
  return apiGet(`/tareas/detalle/${tareaId}`);
}

export function eliminarTarea(tareaId) {
  return apiDelete(`/tareas/${tareaId}`);
}

/**
 * Actualizar datos de una tarea
 */
