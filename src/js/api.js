import { supabase } from './config/supabase.js';

const API_BASE_URL = (globalThis.LUMI_CONFIG?.API_BASE_URL || 'http://localhost:3000/api').replace(/\/$/, '');

const MENSAJES_HTTP = {
  400: 'Los datos enviados no son válidos.',
  401: 'La sesión no es válida o falta la identidad del usuario.',
  403: 'No tienes autorización para realizar esta acción.',
  404: 'El recurso solicitado no existe.',
  500: 'El backend encontró un error interno.',
};

async function solicitar(endpoint, opciones = {}) {
  const headers = new Headers(opciones.headers || {});
  headers.set('Accept', 'application/json');

  if (!headers.has('Authorization')) {
    try {
      const { data } = await supabase.auth.getSession();
      const token = data?.session?.access_token;
      if (token) headers.set('Authorization', `Bearer ${token}`);
    } catch {
      // Algunas peticiones públicas no requieren sesión.
    }
  }

  if (opciones.body !== undefined) {
    headers.set('Content-Type', 'application/json');
  }

  let respuesta;
  try {
    respuesta = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...opciones,
      headers,
    });
  } catch (error) {
    throw new Error('No se pudo conectar con el backend. Verifica que el servidor esté activo.');
  }

  const contenido = await respuesta.text();
  let datos = null;

  if (contenido) {
    try {
      datos = JSON.parse(contenido);
    } catch {
      if (!respuesta.ok) {
        throw new Error(`El backend devolvió una respuesta no válida (${respuesta.status}).`);
      }
      datos = contenido;
    }
  }

  if (!respuesta.ok) {
    const mensaje = datos?.message || datos?.mensaje || datos?.error || MENSAJES_HTTP[respuesta.status] || `Error del backend (${respuesta.status}).`;
    const error = new Error(mensaje);
    error.status = respuesta.status;
    error.details = datos;
    throw error;
  }

  return datos;
}

export const apiGet = (endpoint, opciones = {}) => solicitar(endpoint, { method: 'GET', ...opciones });
export const apiPost = (endpoint, datos, opciones = {}) => solicitar(endpoint, {
  method: 'POST',
  body: datos === undefined ? '' : JSON.stringify(datos),
  ...opciones,
});
export const apiPut = (endpoint, datos, opciones = {}) => solicitar(endpoint, {
  method: 'PUT',
  body: JSON.stringify(datos),
  ...opciones,
});
export const apiDelete = (endpoint, opciones = {}) => solicitar(endpoint, { method: 'DELETE', ...opciones });
export { API_BASE_URL };
