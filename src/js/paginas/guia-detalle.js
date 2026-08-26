import { obtenerPlanIA } from '../servicios/ia.service.js';
import { actualizarEstadoTarea } from '../servicios/tareas.service.js';
import { registrarTareaEstadistica } from '../servicios/estadisticas.service.js';
import { obtenerUsuarioActual } from '../servicios/autenticacion.service.js';
import { generarPlanIA } from '../servicios/ia.service.js';

const DURACION_TRABAJO = 25 * 60;
const DURACION_DESCANSO = 5 * 60;
let pomodoro = { segundos: DURACION_TRABAJO, modo: 'trabajo', intervalo: null };
let planActual = null;
let tarjetas = [];
let tarjetaActual = 0;

document.addEventListener('DOMContentLoaded', async () => {
	const planId = new URLSearchParams(window.location.search).get('plan_id');
	if (!planId) return;

	const contenedor = document.getElementById('detalle-plan');
	if (!contenedor) return;

	try {
		const plan = await obtenerPlanIA(planId);
		planActual = plan;
		renderizarPlan(contenedor, plan);
		inicializarHerramientas(plan);
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

function inicializarHerramientas(plan) {
	const selector = document.getElementById('metodo-selector');
	if (!selector) return;
	const metodo = plan?.metodo_estudio || selector.value;
	selector.value = [...selector.options].some(opcion => opcion.value === metodo) ? metodo : selector.value;
	selector.addEventListener('change', () => cambiarMetodo(selector.value));
	document.getElementById('regenerar-plan')?.addEventListener('click', () => regenerarPlan(selector.value));
	configurarPomodoro();
	configurarFeynman(plan);
	configurarRecall(plan);
	configurarSpaced(plan);
	cambiarMetodo(selector.value);
}

function cambiarMetodo(metodo) {
	const nombres = { 'Pomodoro': 'Pomodoro', 'Active Recall': 'Active Recall', 'Técnica Feynman': 'Método Feynman', 'Spaced Repetition': 'Spaced Repetition' };
	const titulo = document.getElementById('metodo-activo-titulo');
	if (titulo) titulo.textContent = nombres[metodo] || metodo;
	document.querySelectorAll('.herramienta-metodo').forEach(panel => { panel.hidden = true; });
	const panel = { 'Pomodoro': 'metodo-pomodoro', 'Active Recall': 'metodo-recall', 'Técnica Feynman': 'metodo-feynman', 'Spaced Repetition': 'metodo-spaced' }[metodo];
	if (panel) document.getElementById(panel)?.removeAttribute('hidden');
	if (planActual?.metodo_estudio && planActual.metodo_estudio !== metodo) regenerarPlan(metodo);
}

function configurarPomodoro() {
	const tiempo = document.getElementById('pomodoro-tiempo');
	const modo = document.getElementById('pomodoro-modo');
	const pintar = () => { tiempo.textContent = `${String(Math.floor(pomodoro.segundos / 60)).padStart(2, '0')}:${String(pomodoro.segundos % 60).padStart(2, '0')}`; modo.textContent = pomodoro.modo === 'trabajo' ? 'Trabajo enfocado' : 'Descanso'; };
	document.getElementById('pomodoro-iniciar')?.addEventListener('click', () => {
		if (pomodoro.intervalo) return;
		pomodoro.intervalo = setInterval(() => { pomodoro.segundos -= 1; if (pomodoro.segundos <= 0) { pomodoro.modo = pomodoro.modo === 'trabajo' ? 'descanso' : 'trabajo'; pomodoro.segundos = pomodoro.modo === 'trabajo' ? DURACION_TRABAJO : DURACION_DESCANSO; } pintar(); }, 1000);
	});
	document.getElementById('pomodoro-pausar')?.addEventListener('click', () => { clearInterval(pomodoro.intervalo); pomodoro.intervalo = null; });
	document.getElementById('pomodoro-reiniciar')?.addEventListener('click', () => { clearInterval(pomodoro.intervalo); pomodoro = { segundos: DURACION_TRABAJO, modo: 'trabajo', intervalo: null }; pintar(); });
	pintar();
}

function configurarFeynman(plan) {
	const campo = document.getElementById('feynman-explicacion');
	if (campo && plan?.tema) campo.placeholder = `Explica ${plan.tema} con tus palabras...`;
	document.getElementById('feynman-confirmar')?.addEventListener('click', () => {
		const feedback = document.getElementById('feynman-feedback');
		if (!campo.value.trim()) { feedback.textContent = 'Escribe una explicación antes de revisarla.'; feedback.className = 'metodo-feedback error'; campo.focus(); return; }
		feedback.textContent = 'Explicación registrada. Vuelve a las partes que no puedas explicar con claridad.';
		feedback.className = 'metodo-feedback exito';
	});
}

function configurarRecall(plan) {
	tarjetas = Array.isArray(plan?.tarjetas) ? plan.tarjetas : Array.isArray(plan?.preguntas) ? plan.preguntas : [];
	if (!tarjetas.length && plan?.subtareas?.length) tarjetas = plan.subtareas.map(item => ({ pregunta: item.pregunta || `¿Qué debes completar en: ${item.nombre || item.titulo || 'esta subtarea'}?`, respuesta: item.respuesta || item.descripcion || 'Revisa los materiales del plan.' }));
	const mostrar = () => { const tarjeta = tarjetas[tarjetaActual]; document.getElementById('recall-progreso').textContent = `Tarjeta ${tarjetas.length ? tarjetaActual + 1 : 0} de ${tarjetas.length}`; document.getElementById('recall-pregunta').textContent = tarjeta?.pregunta || tarjeta?.question || 'No hay preguntas cargadas todavía.'; document.getElementById('recall-respuesta').textContent = tarjeta?.respuesta || tarjeta?.answer || ''; document.getElementById('recall-respuesta').hidden = true; document.getElementById('recall-mostrar').textContent = 'Mostrar respuesta'; };
	document.getElementById('recall-mostrar')?.addEventListener('click', event => { const respuesta = document.getElementById('recall-respuesta'); respuesta.hidden = !respuesta.hidden; event.currentTarget.textContent = respuesta.hidden ? 'Mostrar respuesta' : 'Ocultar respuesta'; });
	document.getElementById('recall-siguiente')?.addEventListener('click', () => { if (tarjetas.length) tarjetaActual = (tarjetaActual + 1) % tarjetas.length; mostrar(); });
	mostrar();
}

function configurarSpaced(plan) {
	const fechas = Array.isArray(plan?.repasos) ? plan.repasos : [];
	const calendario = document.getElementById('spaced-calendario');
	const lista = document.getElementById('spaced-lista');
	const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
	const dias = fechas.length ? fechas : [0, 1, 3, 7].map(offset => ({ fecha: new Date(hoy.getTime() + offset * 86400000).toISOString().slice(0, 10), estado: offset === 0 ? 'Pendiente' : 'Próximo', titulo: offset === 0 ? 'Repaso de hoy' : `Repaso en ${offset} día${offset === 1 ? '' : 's'}` }));
	calendario.innerHTML = dias.map(item => `<button type="button" class="spaced-dia ${item.estado === 'Pendiente' ? 'pendiente' : ''}" data-fecha="${escapar(item.fecha)}"><strong>${escapar(item.fecha?.slice(8, 10) || '')}</strong><span>${escapar(item.estado || 'Próximo')}</span></button>`).join('');
	const renderLista = fecha => { const seleccionados = dias.filter(item => item.fecha === fecha); lista.innerHTML = seleccionados.length ? seleccionados.map(item => `<li><span>${escapar(item.titulo || 'Repaso')}</span><b class="estado-${String(item.estado || 'próximo').toLowerCase().replace('ó', 'o')}">${escapar(item.estado || 'Próximo')}</b></li>`).join('') : '<li>No hay repasos para este día.</li>'; };
	calendario.querySelectorAll('[data-fecha]').forEach(boton => boton.addEventListener('click', () => renderLista(boton.dataset.fecha)));
	renderLista(dias[0]?.fecha);
	document.getElementById('spaced-alerta').textContent = dias.some(item => item.estado === 'Pendiente') ? 'Tienes repasos pendientes hoy.' : 'No tienes repasos pendientes hoy.';
}

async function regenerarPlan(metodo) {
	if (!planActual?.nombre && !planActual?.titulo) return;
	const selector = document.getElementById('metodo-selector');
	const boton = document.getElementById('regenerar-plan');
	selector.disabled = true;
	if (boton) { boton.disabled = true; boton.textContent = '⚡ Generando...'; }
	try {
		const usuario = await obtenerUsuarioActual();
		const respuesta = await generarPlanIA({ usuario_id: usuario.id, nombre: planActual.nombre || planActual.titulo, descripcion: planActual.descripcion || '', fecha_entrega: planActual.fecha_entrega, metodo_estudio: metodo, dificultad: planActual.dificultad || planActual.prioridad, enfoque_adicional: planActual.enfoque_adicional || '' });
		if (respuesta?.plan_id && respuesta.plan_id !== planActual.id) window.history.replaceState({}, '', `guia-detalle.html?plan_id=${encodeURIComponent(respuesta.plan_id)}`);
		planActual = { ...planActual, ...respuesta, metodo_estudio: metodo };
		configurarRecall(planActual); configurarSpaced(planActual);
	} catch (error) { alert(`No se pudo regenerar el plan: ${error.message}`); } finally { selector.disabled = false; if (boton) { boton.disabled = false; boton.textContent = '⚡ Regenerar'; } }
}

function escapar(valor) {
	return String(valor ?? '').replace(/[&<>'"]/g, caracter => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[caracter]));
}
