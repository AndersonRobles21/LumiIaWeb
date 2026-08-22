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

import { supabase } from '../config/supabase.js';

/**
 * Obtener todas las tareas de un usuario
 * (a través de sus planes → actividades → tareas)
 */
export async function obtenerTareasDelUsuario(usuarioId) {
  // TODO: Implementar con Supabase
  // 1. Buscar planes del usuario
  // 2. Buscar actividades de esos planes
  // 3. Buscar tareas de esas actividades

  console.log('obtenerTareasDelUsuario() - pendiente de conectar', { usuarioId });
  return [];
}

/**
 * Crear una nueva tarea
 * Nota: en el schema real una tarea necesita pertenecer a una actividad
 */
export async function crearTarea(actividadId, datos) {
  // datos esperados:
  // {
  //   titulo: string,
  //   descripcion: string (opcional),
  //   completada: boolean (default false)
  // }

  console.log('crearTarea() - pendiente de conectar', { actividadId, datos });
  return null;
}

/**
 * Marcar tarea como completada / pendiente
 */
export async function actualizarEstadoTarea(tareaId, completada) {
  console.log('actualizarEstadoTarea() - pendiente de conectar', { tareaId, completada });
  return null;
}

/**
 * Actualizar datos de una tarea
 */
export async function actualizarTarea(tareaId, datos) {
  console.log('actualizarTarea() - pendiente de conectar', { tareaId, datos });
  return null;
}

/**
 * Eliminar una tarea
 */
export async function eliminarTarea(tareaId) {
  console.log('eliminarTarea() - pendiente de conectar', { tareaId });
  return null;
}

/**
 * Obtener o crear una actividad "general" temporal
 * (útil mientras no tengamos el sistema completo de planes)
 */
export async function obtenerActividadGeneral(planId) {
  console.log('obtenerActividadGeneral() - pendiente de conectar', { planId });
  return null;
}
