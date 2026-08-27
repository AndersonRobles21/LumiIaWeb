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
  let fotoPerfil = localStorage.getItem('lumi_foto_perfil') || '';
  try {
    const usuario = await obtenerUsuarioActual();
    if (usuario?.id) {
      const respuesta = await obtenerUsuarioConPerfil(usuario.id);
      const envoltura = respuesta?.data || respuesta || {};
      const datos = { ...usuario, ...(envoltura.usuario || envoltura.user || envoltura), ...(envoltura.perfil || envoltura.perfil_estudio || {}) };
      nombre = [datos?.nombre, datos?.apellido].filter(Boolean).join(' ') || datos?.user_metadata?.full_name || '';
      fotoPerfil = fotoPerfil || datos?.foto_perfil || '';
    }
  } catch (error) {
    console.warn('No se pudo cargar el usuario del navbar:', error.message);
  }

 contenedor.innerHTML = `
    <div class="navbar">
      <div class="navbar-acciones">
        <a class="navbar-btn" href="informacion.html" title="Ayuda" aria-label="Abrir ayuda">
          <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M9.7 9a2.4 2.4 0 1 1 3.9 1.9c-1 .7-1.6 1.1-1.6 2.6M12 17h.01"/></svg>
        </a>
        <a class="navbar-avatar${fotoPerfil ? ' navbar-avatar-con-foto' : ''}" href="perfil.html" title="Abrir perfil${nombre ? ` de ${nombre}` : ''}" aria-label="Abrir perfil"${fotoPerfil ? ` style="background-image: url('${fotoPerfil.replace(/'/g, '%27')}')"` : ''}>
          ${fotoPerfil ? '' : (nombre ? nombre.charAt(0).toUpperCase() : '')}
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