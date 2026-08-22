import { obtenerUsuarioActual } from '../servicios/autenticacion.service.js';
import { comprobarAdmin, obtenerUsuarioAdmin, actualizarUsuarioAdmin, eliminarUsuarioAdmin } from '../servicios/administrador.service.js';

const contenedor = document.getElementById('detalle-usuario');
const escapar = valor => String(valor ?? '').replace(/[&<>'"]/g, caracter => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[caracter]));

async function cargarDetalle() {
  const id = new URLSearchParams(window.location.search).get('id');
  if (!id) throw new Error('No se indicó un usuario.');
  const administrador = await obtenerUsuarioActual();
  if (!administrador?.id) throw new Error('La sesión no está autenticada.');
  await comprobarAdmin(administrador.id);
  const respuesta = await obtenerUsuarioAdmin(administrador.id, id);
  const usuario = respuesta?.user || respuesta?.usuario || respuesta?.data || respuesta;
  const perfil = usuario?.perfil_estudio || usuario?.perfil || {};
  contenedor.innerHTML = `<a href="usuarios.html">← Lista de usuarios</a><h1>Detalle de usuario administrador</h1><form id="editar-usuario"><label>Nombre<input id="nombre" value="${escapar(usuario.nombre)}" required></label><p>Correo: ${escapar(usuario.email)}</p><p>Objetivo: ${escapar(perfil.objetivo || 'Sin definir')}</p><p>Racha: ${escapar(usuario.racha ?? perfil.racha ?? 0)} días</p><p>Tareas: ${escapar(usuario.tareas_completadas ?? perfil.tareas_completadas ?? 0)}</p><p>Horarios: ${escapar(JSON.stringify(respuesta?.horarios || perfil.horario || 'Sin definir'))}</p><p>Planes y actividades: ${escapar(usuario.planes ?? 'Consultar historial')}</p><button type="submit">Guardar nombre</button><button type="button" id="eliminar-usuario">Eliminar usuario</button></form>`;
  document.getElementById('editar-usuario').addEventListener('submit', async event => { event.preventDefault(); await actualizarUsuarioAdmin(administrador.id, id, { nombre: document.getElementById('nombre').value.trim() }); alert('Usuario actualizado.'); });
  document.getElementById('eliminar-usuario').addEventListener('click', async () => { if (!confirm('¿Eliminar este usuario?')) return; await eliminarUsuarioAdmin(administrador.id, id); window.location.href = 'usuarios.html'; });
}

document.addEventListener('DOMContentLoaded', () => cargarDetalle().catch(error => { contenedor.innerHTML = `<p>${escapar(error.message)}</p>`; }));
