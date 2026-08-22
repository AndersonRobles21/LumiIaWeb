/**
 * autenticacion.service.js
 * Servicio de autenticación
 * 
 * Usa Supabase Auth + tabla public.usuarios
 * 
 * Flujo real futuro:
 * 1. Supabase Auth (signUp / signIn)
 * 2. Crear o verificar registro en public.usuarios
 * 3. Verificar si ya tiene perfiles_estudio
 */

import { supabase } from '../config/supabase.js';

/**
 * Iniciar sesión
 * @param {string} email
 * @param {string} password
 */
export async function iniciarSesion(email, password) {
  // TODO: Implementar con Supabase Auth
  // const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  console.log('iniciarSesion() - pendiente de conectar con Supabase', { email });
  return null;
}

/**
 * Registrar nuevo usuario
 * @param {string} email
 * @param {string} password
 * @param {object} datosUsuario - { nombre, apellido }
 */
export async function registrarUsuario(email, password, datosUsuario) {
  // Flujo real futuro:
  // 1. supabase.auth.signUp()
  // 2. Insertar en public.usuarios (id = auth.user.id, nombre, apellido...)
  // 3. Opcionalmente crear perfiles_estudio vacío

  console.log('registrarUsuario() - pendiente de conectar con Supabase', {
    email,
    datosUsuario
  });

  return null;
}

/**
 * Cerrar sesión
 */
export async function cerrarSesion() {
  // TODO: await supabase.auth.signOut();

  console.log('cerrarSesion() - pendiente de conectar con Supabase');
  return null;
}

/**
 * Obtener el usuario actualmente autenticado
 */
export async function obtenerUsuarioActual() {
  // TODO: const { data: { user } } = await supabase.auth.getUser();

  console.log('obtenerUsuarioActual() - pendiente de conectar con Supabase');
  return null;
}

/**
 * Verificar si hay sesión activa
 */
export async function haySesionActiva() {
  // TODO: revisar supabase.auth.getSession()

  console.log('haySesionActiva() - pendiente de conectar con Supabase');
  return false;
}
