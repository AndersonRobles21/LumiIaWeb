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
import { apiGet, apiPost } from '../api.js';

/**
 * Iniciar sesión
 * @param {string} email
 * @param {string} password
 */
export async function iniciarSesion(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error(error.message);

  const user = data?.user || (await obtenerUsuarioActual());
  if (!user?.id) throw new Error('Supabase no devolvió el usuario autenticado.');

  try {
    await apiPost('/auth/login', { id: user.id });
  } catch (error) {
    console.warn('No se pudo verificar el login en Node.js:', error.message);
  }
  const perfil = await apiGet(`/auth/profile/${user.id}`);
  let esAdmin = false;
  try {
    esAdmin = Boolean((await apiGet('/admin/check', { headers: { 'x-user-id': user.id } }))?.admin);
  } catch (error) {
    if (error.status !== 403) console.warn('No se pudo comprobar el rol:', error.message);
  }
  return { user, perfil, esAdmin };
}

/**
 * Registrar nuevo usuario
 * @param {string} email
 * @param {string} password
 * @param {object} datosUsuario - { nombre, apellido }
 */
export async function registrarUsuario(email, password, datosUsuario) {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw new Error(error.message);

  const user = data?.user;
  if (!user?.id) throw new Error('Supabase no devolvió el UUID del usuario.');

  const perfil = await apiPost('/auth/register', {
    id: user.id,
    nombre: datosUsuario.nombre,
    apellido: datosUsuario.apellido || null,
    rol_id: null,
  });
  return { user, perfil };
}

/**
 * Cerrar sesión
 */
export async function cerrarSesion() {
  const { error } = await supabase.auth.signOut();
  if (error) throw new Error(error.message);
}

/**
 * Obtener el usuario actualmente autenticado
 */
export async function obtenerUsuarioActual() {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw new Error(error.message);
  return data?.user || null;
}

/**
 * Verificar si hay sesión activa
 */
export async function haySesionActiva() {
  const { data, error } = await supabase.auth.getSession();
  if (error) return false;
  return Boolean(data?.session);
}

export async function obtenerIdUsuarioActual() {
  const usuario = await obtenerUsuarioActual();
  if (!usuario?.id) throw new Error('La sesión no está autenticada.');
  return usuario.id;
}
