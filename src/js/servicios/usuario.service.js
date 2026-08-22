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

import { supabase } from '../config/supabase.js';

/**
 * Obtiene los datos del usuario + su perfil de estudio
 * @param {string} usuarioId - UUID del usuario
 */
export async function obtenerUsuarioConPerfil(usuarioId) {
  // TODO: Implementar con Supabase
  // 1. Buscar en public.usuarios
  // 2. Buscar en public.perfiles_estudio por usuario_id
  // 3. Devolver ambos juntos

  console.log('obtenerUsuarioConPerfil() - pendiente de conectar con Supabase');
  return null;
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
  // datos esperados:
  // {
  //   horas_disponibles: number,
  //   objetivo: string,
  //   nivel_procrastinacion: number (opcional),
  //   foto_perfil: string (opcional)
  // }

  console.log('guardarPerfilEstudio() - pendiente de conectar con Supabase', {
    usuarioId,
    datos
  });

  return null;
}

/**
 * Actualiza datos básicos del usuario (nombre, apellido)
 */
export async function actualizarUsuario(usuarioId, datos) {
  // datos esperados:
  // {
  //   nombre: string,
  //   apellido: string (opcional)
  // }

  console.log('actualizarUsuario() - pendiente de conectar con Supabase', {
    usuarioId,
    datos
  });

  return null;
}
