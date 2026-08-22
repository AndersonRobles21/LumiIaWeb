/**
 * usuario.service.js
 * Servicio de usuarios y perfiles de estudio
 * 
 * Tablas relacionadas (schema real):
 * - public.usuarios
 * - public.perfiles_estudio
 * 
 * Por ahora: solo estructura preparada.
 * Más adelante se conectará con Supabase.
 */

import { apiGet, apiPut } from '../api.js';

/**
 * Obtiene los datos del usuario + su perfil de estudio
 * @param {string} usuarioId - UUID del usuario
 */
export async function obtenerUsuarioConPerfil(usuarioId) {
  return apiGet(`/auth/profile/${usuarioId}`);
}

/**
 * Crea o actualiza el perfil de estudio del usuario
 * Campos reales de perfiles_estudio:
 * - horas_disponibles (integer)
 * - objetivo (text)
 * - nivel_procrastinacion (integer)
 * - foto_perfil (text)
 */
export async function guardarPerfilEstudio(usuarioId, datos) {
  return apiPut(`/auth/profile/${usuarioId}`, datos);
}

/**
 * Actualiza datos básicos del usuario (nombre, apellido)
 */
export async function actualizarUsuario(usuarioId, datos) {
  return apiPut(`/auth/profile/${usuarioId}`, datos);
}
