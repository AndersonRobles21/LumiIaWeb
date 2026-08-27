import { apiGet, apiPut, apiDelete } from '../api.js';
import { supabase } from '../config/supabase.js';

const opcionesAdmin = usuarioId => ({
	headers: { 'x-user-id': usuarioId },
});

export const comprobarAdmin = usuarioId => apiGet('/admin/check', opcionesAdmin(usuarioId));
export async function obtenerTotalAdministradores() {
	const { data, error } = await supabase.from('usuarios').select('id').eq('es_admin', true);
	if (error) throw new Error(error.message);
	return data?.length ?? 0;
}

export async function obtenerResumenAdmin(usuarioId) {
	try {
		return await apiGet('/admin/overview', opcionesAdmin(usuarioId));
	} catch (error) {
		if (error.status !== 500 && error.status !== 404) throw error;

		const resultados = await Promise.allSettled([
			supabase.from('usuarios').select('id', { count: 'exact', head: true }),
			supabase.from('usuarios').select('id', { count: 'exact', head: true }).eq('es_admin', true),
			supabase.from('planes_estudio').select('id', { count: 'exact', head: true }),
			supabase.from('estadisticas').select('tareas_completadas, horas_estudio'),
		]);
		const [usuarios, admins, planes, estadisticas] = resultados.map(resultado => resultado.status === 'fulfilled' ? resultado.value : { data: null, count: null, error: resultado.reason });

		const filasEstadisticas = estadisticas.data || [];
		const tareasCompletadas = filasEstadisticas.reduce((total, fila) => total + Number(fila.tareas_completadas || 0), 0);
		const horasEstudio = filasEstadisticas.reduce((total, fila) => total + Number(fila.horas_estudio || 0), 0);
		return Object.fromEntries([
			['totalUsers', usuarios.count],
			['totalAdmins', admins.count],
			['totalPlans', planes.count],
			['completedTasks', estadisticas.error ? null : tareasCompletadas],
			['totalStudyHours', estadisticas.error ? null : horasEstudio],
		].filter(([, valor]) => valor !== null && valor !== undefined));
	}
}
export const obtenerUsuariosAdmin = (usuarioId, search = '', page = 1, limit = 25) => apiGet(`/admin/users?search=${encodeURIComponent(search)}&page=${page}&limit=${limit}`, opcionesAdmin(usuarioId));
export async function obtenerUsuarioAdmin(usuarioId, id) {
	try {
		return await apiGet(`/admin/users/${id}`, opcionesAdmin(usuarioId));
	} catch (error) {
		if (error.status !== 500 && error.status !== 404) throw error;

		const [usuario, perfil, horarios, estadisticas, planes] = await Promise.all([
			supabase.from('usuarios').select('id, nombre, apellido, rol_id, fecha_registro, es_admin').eq('id', id).maybeSingle(),
			supabase.from('perfiles_estudio').select('horas_disponibles, objetivo, nivel_procrastinacion, foto_perfil').eq('usuario_id', id).maybeSingle(),
			supabase.from('horarios').select('id, dia, hora_inicio, hora_fin').eq('usuario_id', id).order('dia'),
			supabase.from('estadisticas').select('tareas_completadas, horas_estudio, racha, ultima_racha_fecha').eq('usuario_id', id).maybeSingle(),
			supabase.from('planes_estudio').select('id, nombre, descripcion, estado, fecha_creacion').eq('usuario_id', id).order('fecha_creacion', { ascending: false }),
		]);
		const fallo = [usuario, perfil, horarios, estadisticas, planes].find(respuesta => respuesta.error);
		if (fallo) throw new Error(fallo.error.message);
		return {
			user: { ...(usuario.data || {}), perfil_estudio: perfil.data || {}, estadisticas: estadisticas.data || {}, planes_estudio: planes.data || [] },
			horarios: horarios.data || [],
		};
	}
}
export const actualizarUsuarioAdmin = (usuarioId, id, datos) => apiPut(`/admin/users/${id}`, datos, opcionesAdmin(usuarioId));
export async function eliminarUsuarioAdmin(usuarioId, id) {
	const { data: usuario, error } = await supabase.from('usuarios').select('es_admin').eq('id', id).maybeSingle();
	if (error) throw new Error(error.message);
	if (usuario?.es_admin) throw new Error('No se puede eliminar un usuario administrador.');
	return apiDelete(`/admin/users/${id}`, opcionesAdmin(usuarioId));
}
