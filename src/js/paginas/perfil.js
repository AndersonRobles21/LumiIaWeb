/**
 * perfil.js
 * Lógica de la página Perfil
 * Carga el perfil desde el backend
 */

import { obtenerUsuarioActual } from '../servicios/autenticacion.service.js';
import { obtenerUsuarioConPerfil, guardarPerfilEstudio } from '../servicios/usuario.service.js';

document.addEventListener('DOMContentLoaded', () => {
  cargarPerfil();
});

async function cargarPerfil() {
  try {
    const usuario = await obtenerUsuarioActual();
    if (!usuario?.id) throw new Error('La sesión no está autenticada.');
    const respuesta = await obtenerUsuarioConPerfil(usuario.id);
    const usuarioPerfil = respuesta?.usuario || respuesta?.user || respuesta;
    const perfil = respuesta?.perfil_estudio || respuesta?.perfil || usuarioPerfil?.perfil_estudio || respuesta || {};
    const nombre = [usuarioPerfil?.nombre, usuarioPerfil?.apellido].filter(Boolean).join(' ');

    const nombreEl = document.getElementById('perfil-nombre');
    if (nombreEl) nombreEl.textContent = nombre || 'Usuario';

    const datoNombre = document.getElementById('dato-nombre');
    const datoObjetivo = document.getElementById('dato-objetivo');
    const datoHoras = document.getElementById('dato-horas');
    const datoMetodo = document.getElementById('dato-metodo');

    if (datoNombre) datoNombre.textContent = nombre || '—';
    if (datoObjetivo) datoObjetivo.textContent = perfil.objetivo || '—';
    if (datoHoras) datoHoras.textContent = perfil.horas_disponibles ?? '—';
    if (datoMetodo) datoMetodo.textContent = perfil.metodo_estudio || perfil.metodo || '—';

    const avatar = document.querySelector('.perfil-avatar-grande');
    if (avatar && nombre) avatar.textContent = nombre.charAt(0).toUpperCase();

    document.getElementById('perfil-nombre-edicion').value = usuarioPerfil?.nombre || '';
    document.getElementById('perfil-apellido-edicion').value = usuarioPerfil?.apellido || '';
    document.getElementById('perfil-objetivo-edicion').value = perfil.objetivo || '';
    document.getElementById('perfil-procrastinacion-edicion').value = perfil.nivel_procrastinacion || 1;
    document.getElementById('formulario-edicion-perfil').dataset.usuarioId = usuario.id;
  } catch (error) {
    alert(`No se pudo cargar el perfil: ${error.message}`);
  }

}

document.addEventListener('DOMContentLoaded', () => {
  const boton = document.getElementById('editar-perfil');
  const formulario = document.getElementById('formulario-edicion-perfil');
  boton?.addEventListener('click', () => { formulario.hidden = !formulario.hidden; });
  formulario?.addEventListener('submit', async event => {
    event.preventDefault();
    const estado = document.getElementById('estado-edicion-perfil');
    try {
      await guardarPerfilEstudio(formulario.dataset.usuarioId, {
        nombre: document.getElementById('perfil-nombre-edicion').value.trim(),
        apellido: document.getElementById('perfil-apellido-edicion').value.trim(),
        objetivo: document.getElementById('perfil-objetivo-edicion').value.trim(),
        nivel_procrastinacion: Number(document.getElementById('perfil-procrastinacion-edicion').value),
        horario: document.getElementById('perfil-horarios-edicion').value.trim(),
      });
      estado.textContent = 'Cambios guardados.';
      await cargarPerfil();
    } catch (error) { estado.textContent = `No se pudieron guardar los cambios: ${error.message}`; }
  });
});

