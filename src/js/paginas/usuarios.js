import { obtenerUsuarioActual } from '../servicios/autenticacion.service.js';
import { comprobarAdmin, obtenerUsuariosAdmin } from '../servicios/administrador.service.js';

let administradorId = null;
const lista = document.getElementById('lista-usuarios');
const escapar = valor => String(valor ?? '').replace(/[&<>'"]/g, caracter => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[caracter]));

async function cargarUsuarios() {
  try {
    const respuesta = await obtenerUsuariosAdmin(administradorId, document.getElementById('busqueda').value.trim());
    const usuarios = respuesta?.users || respuesta?.usuarios || respuesta?.data || [];
    lista.innerHTML = usuarios.length ? usuarios.map(usuario => `<a href="modificar-usuario.html?id=${encodeURIComponent(usuario.id)}"><strong>${escapar([usuario.nombre, usuario.apellido].filter(Boolean).join(' ') || 'Sin nombre')}</strong><span>${escapar(usuario.email)}</span></a>`).join('') : '<p>No se encontraron usuarios.</p>';
  } catch (error) { lista.innerHTML = `<p>${escapar(error.message)}</p>`; }
}

document.addEventListener('DOMContentLoaded', async () => {
  try { const usuario = await obtenerUsuarioActual(); administradorId = usuario?.id; await comprobarAdmin(administradorId); await cargarUsuarios(); } catch (error) { lista.innerHTML = `<p>${escapar(error.message)}</p>`; }
  document.getElementById('buscar-usuarios')?.addEventListener('submit', event => { event.preventDefault(); cargarUsuarios(); });
  document.getElementById('recargar-usuarios')?.addEventListener('click', cargarUsuarios);
});
