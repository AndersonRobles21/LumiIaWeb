import { obtenerUsuarioActual } from '../servicios/autenticacion.service.js';
import { comprobarAdmin, obtenerUsuariosAdmin } from '../servicios/administrador.service.js';

let administradorId = null;
const lista = document.getElementById('lista-usuarios');
const escapar = valor => String(valor ?? '').replace(/[&<>'"]/g, caracter => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[caracter]));
const extraerUsuarios = respuesta => {
  const datos = respuesta?.data || respuesta;
  return datos?.users || datos?.usuarios || (Array.isArray(datos) ? datos : []);
};

async function cargarUsuarios() {
  try {
    const respuesta = await obtenerUsuariosAdmin(administradorId, document.getElementById('busqueda').value.trim());
    const usuarios = extraerUsuarios(respuesta);
    document.getElementById('usuarios-contador').textContent = `${usuarios.length} usuario${usuarios.length === 1 ? '' : 's'} encontrado${usuarios.length === 1 ? '' : 's'}`;
    lista.innerHTML = usuarios.length ? usuarios.map(usuario => { const nombre = [usuario.nombre, usuario.apellido].filter(Boolean).join(' ') || 'Sin nombre'; const inicial = nombre.charAt(0).toUpperCase(); const foto = usuario.foto_perfil || usuario.avatar_url || ''; return `<a class="usuario-card" href="modificar-usuario.html?id=${encodeURIComponent(usuario.id)}"><div class="usuario-avatar">${foto ? `<img src="${escapar(foto)}" alt="Foto de ${escapar(nombre)}">` : escapar(inicial)}</div><div class="usuario-card-datos"><strong>${escapar(nombre)}</strong><span>${escapar(usuario.email || 'Correo no disponible')}</span><small>${escapar(usuario.programa || usuario.programa_academico || 'Perfil de estudiante')}</small></div><span class="usuario-card-flecha">→</span></a>`; }).join('') : '<p class="estado-usuarios">No se encontraron usuarios.</p>';
  } catch (error) { lista.innerHTML = `<p>${escapar(error.message)}</p>`; }
}

document.addEventListener('DOMContentLoaded', async () => {
  try { const usuario = await obtenerUsuarioActual(); administradorId = usuario?.id; await comprobarAdmin(administradorId); await cargarUsuarios(); } catch (error) { lista.innerHTML = `<p>${escapar(error.message)}</p>`; }
  document.getElementById('buscar-usuarios')?.addEventListener('submit', event => { event.preventDefault(); cargarUsuarios(); });
  document.getElementById('recargar-usuarios')?.addEventListener('click', cargarUsuarios);
});
