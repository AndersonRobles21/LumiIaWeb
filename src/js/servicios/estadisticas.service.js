import { apiGet, apiPost } from '../api.js';

export async function obtenerEstadisticas(usuarioId) {
	return apiGet(`/auth/estadisticas/${usuarioId}`);
}

export async function registrarRacha(usuarioId) {
	return apiPost(`/auth/estadisticas/${usuarioId}/racha`);
}
