import { apiGet, apiPost } from '../api.js';
import { construirPromptPlan } from '../../../prompts/promt.js';

export function generarPlanIA(datos) {
	const diasRestantes = Math.max(1, Number(datos.diasRestantes ?? datos.dias_disponibles ?? 1));
	const horasDisponibles = Math.max(0, Number(datos.horasDisponibles ?? datos.horas_disponibles ?? 0));
	const minutosCalculados = horasDisponibles * 60 * diasRestantes;
	const contexto = {
		titulo: datos.titulo ?? datos.nombre ?? '',
		descripcion: datos.descripcion ?? '',
		fechaEntrega: datos.fechaEntrega ?? datos.fecha_entrega,
		metodoEstudio: datos.metodoEstudio ?? datos.metodo_estudio ?? 'Auto',
		dificultad: datos.dificultad ?? 'Media',
		enfoqueAdicional: datos.enfoqueAdicional ?? '',
		nombreUsuario: datos.nombreUsuario ?? 'Estudiante',
		objetivo: datos.objetivo ?? '',
		horasDisponibles,
		nivelProcrastinacion: Number(datos.nivelProcrastinacion ?? datos.nivel_procrastinacion ?? 3),
		mensajeUsuario: datos.mensajeUsuario ?? '',
		diasRestantes,
		minutosDisponibles: Math.max(15, Number(datos.minutosDisponibles ?? datos.minutos_disponibles ?? minutosCalculados)),
	};

	return apiPost('/ia/generar', {
		usuario_id: datos.usuarioId ?? datos.usuario_id,
		plan_id: datos.planId ?? datos.plan_id,
			nombre: contexto.titulo,
			fecha_entrega: contexto.fechaEntrega,
			metodo_estudio: contexto.metodoEstudio,
			horas_disponibles: contexto.horasDisponibles,
			dias_disponibles: contexto.diasRestantes,
			minutos_disponibles: contexto.minutosDisponibles,
		...contexto,
		prompt: construirPromptPlan(contexto),
	});
}

export async function obtenerHistorialIA(usuarioId) {
	const respuesta = await apiGet(`/ia/historial/${usuarioId}`);
	return Array.isArray(respuesta) ? respuesta : [];
}

export function obtenerPlanIA(planId) {
	return apiGet(`/ia/plan/${planId}`);
}
