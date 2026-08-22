import { apiGet, apiPut, apiDelete } from '../api.js';

const opcionesAdmin = usuarioId => ({
	headers: { 'x-user-id': usuarioId },
});

export const comprobarAdmin = usuarioId => apiGet('/admin/check', opcionesAdmin(usuarioId));
export const obtenerResumenAdmin = usuarioId => apiGet('/admin/overview', opcionesAdmin(usuarioId));
export const obtenerUsuariosAdmin = (usuarioId, search = '', page = 1, limit = 25) => apiGet(`/admin/users?search=${encodeURIComponent(search)}&page=${page}&limit=${limit}`, opcionesAdmin(usuarioId));
export const obtenerUsuarioAdmin = (usuarioId, id) => apiGet(`/admin/users/${id}`, opcionesAdmin(usuarioId));
export const actualizarUsuarioAdmin = (usuarioId, id, datos) => apiPut(`/admin/users/${id}`, datos, opcionesAdmin(usuarioId));
export const eliminarUsuarioAdmin = (usuarioId, id) => apiDelete(`/admin/users/${id}`, opcionesAdmin(usuarioId));
