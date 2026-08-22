/**
 * perfil.js
 * Lógica de la página Perfil
 * Por ahora usa localStorage (temporal)
 */

console.log('perfil.js cargado');

document.addEventListener('DOMContentLoaded', () => {
  cargarPerfil();
});

function cargarPerfil() {
  const perfilGuardado = localStorage.getItem('lumi_perfil');

  if (!perfilGuardado) {
    console.log('No hay perfil guardado todavía');
    return;
  }

  const perfil = JSON.parse(perfilGuardado);

  // Nombre principal
  const nombreEl = document.getElementById('perfil-nombre');
  if (nombreEl) nombreEl.textContent = perfil.nombre || 'Usuario';

  // Datos
  const datoNombre = document.getElementById('dato-nombre');
  const datoObjetivo = document.getElementById('dato-objetivo');
  const datoHoras = document.getElementById('dato-horas');
  const datoMetodo = document.getElementById('dato-metodo');

  if (datoNombre) datoNombre.textContent = perfil.nombre || '—';
  if (datoObjetivo) datoObjetivo.textContent = perfil.objetivoTexto || '—';
  if (datoHoras) datoHoras.textContent = perfil.horasTexto || '—';
  if (datoMetodo) datoMetodo.textContent = perfil.metodo || '—';

  // Actualizar avatar con la inicial del nombre
  const avatar = document.querySelector('.perfil-avatar-grande');
  if (avatar && perfil.nombre) {
    avatar.textContent = perfil.nombre.charAt(0).toUpperCase();
  }

  console.log('Perfil cargado:', perfil);
}

