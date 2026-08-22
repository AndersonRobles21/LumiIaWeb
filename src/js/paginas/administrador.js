import { obtenerUsuarioActual } from '../servicios/autenticacion.service.js';
import { comprobarAdmin, obtenerResumenAdmin, obtenerUsuariosAdmin, eliminarUsuarioAdmin } from '../servicios/administrador.service.js';

document.addEventListener('DOMContentLoaded', cargarAdministracion);

async function cargarAdministracion() {
	const contenedor = document.getElementById('admin-contenido');
	if (!contenedor) return;
	try {
		const usuario = await obtenerUsuarioActual();
		if (!usuario?.id) throw new Error('La sesión no está autenticada.');
		await comprobarAdmin(usuario.id);
		const [resumen, usuariosRespuesta] = await Promise.all([
			obtenerResumenAdmin(usuario.id),
			obtenerUsuariosAdmin(usuario.id),
		]);
		const usuarios = usuariosRespuesta?.users || usuariosRespuesta?.usuarios || usuariosRespuesta?.data || [];
		const datos = resumen?.data || resumen || {};
		contenedor.innerHTML = `<h1>Panel administrador</h1><div class="admin-estadisticas"><p>Usuarios activos: <strong>${escapar(datos.usuarios_activos ?? datos.active_users ?? usuarios.length)}</strong></p><p>Promedio de rachas: <strong>${escapar(datos.promedio_rachas ?? datos.average_streak ?? 0)}</strong></p><p>Total de usuarios: <strong>${escapar(datos.total_usuarios ?? datos.total_users ?? usuarios.length)}</strong></p></div><a href="usuarios.html">Ver lista de usuarios</a><button type="button" id="admin-cerrar-sesion">Cerrar sesión</button>`;
		contenedor.querySelector('#admin-cerrar-sesion').addEventListener('click', cerrarSesionAdmin);
	} catch (error) {
		contenedor.innerHTML = `<p>${escapar(error.message)}</p>`;
	}
}

async function cerrarSesionAdmin() {
	try {
		await (await import('../servicios/autenticacion.service.js')).cerrarSesion();
		window.location.href = 'login.html';
	} catch (error) {
		alert(`No se pudo cerrar sesión: ${error.message}`);
	}
}

async function eliminarDesdeAdmin(usuarioId, id) {
	if (usuarioId === id) {
		alert('No puedes eliminar tu propio usuario.');
		return;
	}
	if (!confirm('¿Eliminar este usuario?')) return;
	try {
		await eliminarUsuarioAdmin(usuarioId, id);
		await cargarAdministracion();
	} catch (error) {
		alert(`No se pudo eliminar el usuario: ${error.message}`);
	}
}

function escapar(valor) {
	return String(valor ?? '').replace(/[&<>'"]/g, caracter => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[caracter]));
}
