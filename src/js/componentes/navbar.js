/**
 * navbar.js
 * Componente reutilizable del Navbar de LUMI
 */

import { obtenerUsuarioActual } from '../servicios/autenticacion.service.js';
import { obtenerUsuarioConPerfil } from '../servicios/usuario.service.js';

export async function crearNavbar() {
  const contenedor = document.getElementById('navbar-container');
  if (!contenedor) {
    return;
  }

  let nombre = '';
  let fotoPerfil = '';
  try {
    const usuario = await obtenerUsuarioActual();
    if (usuario?.id) {
      const respuesta = await obtenerUsuarioConPerfil(usuario.id);
      const envoltura = respuesta?.data || respuesta || {};
      const datosUsuario = envoltura.usuario || envoltura.user || {};
      const datosPerfil = envoltura.perfil_estudio || envoltura.perfil || datosUsuario.perfil_estudio || datosUsuario.perfil || {};
      const datos = { ...usuario, ...envoltura, ...datosUsuario, ...datosPerfil };
      nombre = [datos?.nombre, datos?.apellido].filter(Boolean).join(' ') || datos?.user_metadata?.full_name || '';
      fotoPerfil = normalizarFoto(
        datosPerfil.foto_perfil || datosPerfil.avatar_url ||
        datosUsuario.foto_perfil || datosUsuario.avatar_url ||
        envoltura.foto_perfil || envoltura.avatar_url || datos.foto_perfil || datos.avatar_url || ''
      );
    }
  } catch (error) {
    console.warn('No se pudo cargar el usuario del navbar:', error.message);
  }

  const fotoUrl = obtenerUrlFoto(fotoPerfil);

 contenedor.innerHTML = `
    <div class="navbar">
      <div class="navbar-acciones">
        <a class="navbar-btn" href="informacion.html" title="Ayuda" aria-label="Abrir ayuda">
          <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M9.7 9a2.4 2.4 0 1 1 3.9 1.9c-1 .7-1.6 1.1-1.6 2.6M12 17h.01"/></svg>
        </a>
        <a class="navbar-avatar${fotoUrl ? ' navbar-avatar-con-foto' : ''}" href="perfil.html" title="Abrir perfil${nombre ? ` de ${nombre}` : ''}" aria-label="Abrir perfil"${fotoUrl ? ` style="background-image: url('${fotoUrl.replace(/'/g, '%27')}')"` : ''}>
          ${fotoUrl ? '' : (nombre ? nombre.charAt(0).toUpperCase() : '')}
        </a>
      </div>
    </div>
  `;

  console.log('Navbar insertado correctamente con logo oficial');
}

// Ejecutar cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', crearNavbar);
} else {
  crearNavbar();
}

function obtenerUrlFoto(valor) {
  const foto = String(valor || '').trim();
  if (!foto) return '';
  if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?\//i.test(foto)) return '';
  if (foto.startsWith('data:image/') || foto.startsWith('http://') || foto.startsWith('https://')) return foto;
  return `data:image/jpeg;base64,${foto.replace(/\s/g, '')}`;
}

function normalizarFoto(valor) {
  const foto = String(valor || '').trim();
  if (!foto || /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?\//i.test(foto)) return '';
  return foto.replace(/\s/g, '');
}