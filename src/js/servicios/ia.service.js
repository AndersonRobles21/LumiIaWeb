import { apiGet, apiPost } from '../api.js';

export function generarPlanIA(datos) {
	return apiPost('/ia/generar', datos);
}

export async function obtenerHistorialIA(usuarioId) {
	const respuesta = await apiGet(`/ia/historial/${usuarioId}`);
	return Array.isArray(respuesta) ? respuesta : [];
}

export function obtenerPlanIA(planId) {
	return apiGet(`/ia/plan/${planId}`);
}
