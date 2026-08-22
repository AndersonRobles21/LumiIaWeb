import { obtenerPlanIA } from '../servicios/ia.service.js';
import { actualizarEstadoTarea } from '../servicios/tareas.service.js';
import { registrarTareaEstadistica } from '../servicios/estadisticas.service.js';
import { obtenerUsuarioActual } from '../servicios/autenticacion.service.js';

document.addEventListener('DOMContentLoaded', async () => {
	const planId = new URLSearchParams(window.location.search).get('plan_id');
	if (!planId) return;

	const contenedor = document.getElementById('detalle-plan');
	if (!contenedor) return;

	try {
		const plan = await obtenerPlanIA(planId);
		renderizarPlan(contenedor, plan);
	} catch (error) {
		contenedor.innerHTML = `<p class="error">No se pudo cargar el plan: ${escapar(error.message)}</p>`;
	}
});

function renderizarPlan(contenedor, plan) {
	const subtareas = Array.isArray(plan?.subtareas) ? plan.subtareas : [];
	contenedor.hidden = false;
	contenedor.innerHTML = `<h2>Plan generado</h2>
		<p><strong>Método:</strong> ${escapar(plan?.metodo_estudio || '')}</p>
		<p>${escapar(plan?.justificacion || '')}</p>
		<p><strong>Tiempo estimado:</strong> ${plan?.tiempo_estimado_total ?? 0}</p>
		<h3>Subtareas</h3>
		<ul>${subtareas.map((subtarea, indice) => `<li><label><input type="checkbox" data-tarea-id="${escapar(subtarea.id || '')}" ${subtarea.completada ? 'checked' : ''} ${subtarea.id ? '' : 'disabled'}> ${escapar(subtarea.nombre || subtarea.titulo || subtarea.descripcion || `Subtarea ${indice + 1}`)}</label></li>`).join('')}</ul>
		<p>${escapar(plan?.resumen_final || '')}</p>`;

	contenedor.querySelectorAll('[data-tarea-id]').forEach(control => {
		control.addEventListener('change', async () => {
			try {
				await actualizarEstadoTarea(control.dataset.tareaId, control.checked);
				if (control.checked) {
					const usuario = await obtenerUsuarioActual();
					await registrarTareaEstadistica(usuario.id);
				}
			} catch (error) {
				control.checked = !control.checked;
				alert(`No se pudo actualizar la subtarea: ${error.message}`);
			}
		});
	});
}

function escapar(valor) {
	return String(valor ?? '').replace(/[&<>'"]/g, caracter => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[caracter]));
}
