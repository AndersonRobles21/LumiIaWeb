/**
 * perfil.js
 * Gestión de perfil con persistencia local instantánea y sincronización backend.
 */

import { obtenerUsuarioActual } from '../servicios/autenticacion.service.js';
import { obtenerUsuarioConPerfil, guardarPerfilEstudio } from '../servicios/usuario.service.js';
import { validarHorarios, calcularHorasDisponibles } from '../utilidades/horarios.js';

const DIAS_SEMANA = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

const MAPA_INDICES_DIAS = {
  'Lunes': 0, 'Martes': 1, 'Miércoles': 2, 'Jueves': 3, 'Viernes': 4, 'Sábado': 5, 'Domingo': 6
};

let usuarioActual = null;
let horariosLocales = [];

document.addEventListener('DOMContentLoaded', async () => {
  await cargarDatosPerfil();
  inicializarEventos();
});

async function cargarDatosPerfil() {
  try {
    usuarioActual = await obtenerUsuarioActual();
    
    // 1. Intentar cargar desde Backend
    let datosHorarios = [];
    if (usuarioActual?.id) {
      const respuestaApi = await obtenerUsuarioConPerfil(usuarioActual.id);
      const datosUsuario = respuestaApi?.usuario || respuestaApi || {};
      const datosPerfil = respuestaApi?.perfil || respuestaApi?.perfil_estudio || respuestaApi || {};
      datosHorarios = respuestaApi?.horarios || respuestaApi?.perfil?.horarios || [];

      document.getElementById('perfil-nombre').value = datosPerfil?.nombre || datosUsuario?.nombre || usuarioActual.nombre || '';
      document.getElementById('perfil-apellido').value = datosPerfil?.apellido || datosUsuario?.apellido || usuarioActual.apellido || '';
      document.getElementById('perfil-objetivo').value = datosPerfil?.objetivo || '';
      document.getElementById('perfil-procrastinacion').value = datosPerfil?.nivel_procrastinacion || '3';

      const nombreDisplay = datosPerfil?.nombre || datosUsuario?.nombre || usuarioActual.nombre || 'Usuario';
      document.getElementById('avatar-nombre-display').textContent = nombreDisplay;
      document.getElementById('perfil-avatar').textContent = nombreDisplay.charAt(0).toUpperCase();
    }

    // 2. Si el backend no tiene horarios, cargar de localStorage (Fallback)
    const localCache = JSON.parse(localStorage.getItem('lumi_horarios_estudio') || '{}');
    if (Array.isArray(datosHorarios) && datosHorarios.length > 0) {
      horariosLocales = datosHorarios;
    } else if (localCache.horarios && localCache.horarios.length > 0) {
      horariosLocales = localCache.horarios;
    } else {
      horariosLocales = [];
    }

    renderizarSemana();
    guardarEnLocalStorage(); // Asegura sincronización inmediata
  } catch (error) {
    console.error('Error al cargar datos del perfil:', error);
    mostrarErrorHorario('No se pudieron recuperar los datos completos.');
  }
}

function inicializarEventos() {
  const btnAgregar = document.getElementById('btn-agregar-horario');
  const formulario = document.getElementById('formulario-perfil');

  if (btnAgregar) btnAgregar.addEventListener('click', agregarBloqueHorario);
  if (formulario) formulario.addEventListener('submit', guardarPerfil);
}

function agregarBloqueHorario() {
  ocultarErrorHorario();

  const diaSelect = document.getElementById('horario-dia');
  const inicioInput = document.getElementById('horario-inicio');
  const finInput = document.getElementById('horario-fin');

  const dia = diaSelect.value;
  const hora_inicio = inicioInput.value;
  const hora_fin = finInput.value;

  if (!hora_inicio || !hora_fin) {
    mostrarErrorHorario('Selecciona una hora de inicio y fin válidas.');
    return;
  }

  const nuevoHorario = { dia, hora_inicio, hora_fin };
  const horariosSimulados = [...horariosLocales, nuevoHorario];

  try {
    validarHorarios(horariosSimulados);
    horariosLocales = horariosSimulados;
    
    inicioInput.value = '';
    finInput.value = '';
    
    renderizarSemana();
    guardarEnLocalStorage(); // Persistencia inmediata
  } catch (error) {
    mostrarErrorHorario(error.message);
  }
}

function eliminarBloqueHorario(index) {
  if (!window.confirm('¿Eliminar este bloque de horario?')) return;
  
  horariosLocales.splice(index, 1);
  renderizarSemana();
  guardarEnLocalStorage(); // Persistencia inmediata
}

function guardarEnLocalStorage() {
  const diasActivos = [...new Set(
    horariosLocales
      .map(h => MAPA_INDICES_DIAS[h.dia])
      .filter(idx => idx !== undefined)
  )];

  const data = {
    dias: diasActivos,
    horarios: horariosLocales
  };

  localStorage.setItem('lumi_horarios_estudio', JSON.stringify(data));
}

function formatearHora12(hora24) {
  if (!hora24 || typeof hora24 !== 'string') return '';
  const [horasStr, minutosStr] = hora24.split(':');
  let horas = parseInt(horasStr, 10);
  if (isNaN(horas)) return hora24;

  const ampm = horas >= 12 ? 'PM' : 'AM';
  horas = horas % 12 || 12;
  return `${horas.toString().padStart(2, '0')}:${minutosStr} ${ampm}`;
}

function renderizarSemana() {
  const contenedor = document.getElementById('contenedor-semana');
  if (!contenedor) return;

  contenedor.innerHTML = DIAS_SEMANA.map(dia => {
    const bloquesDelDia = horariosLocales.filter(h => h.dia === dia);
    const tieneHorarios = bloquesDelDia.length > 0;

    return `
      <div class="dia-columna ${tieneHorarios ? 'con-horarios' : ''}">
        <span class="dia-titulo">${dia}</span>
        ${
          tieneHorarios
            ? bloquesDelDia.map(bloque => {
                const globalIndex = horariosLocales.indexOf(bloque);
                return `
                  <div class="bloque-tiempo">
                    <span class="bloque-rango">${formatearHora12(bloque.hora_inicio)} - ${formatearHora12(bloque.hora_fin)}</span>
                    <button type="button" class="btn-eliminar-bloque" data-index="${globalIndex}">✕</button>
                  </div>
                `;
              }).join('')
            : '<span class="sin-bloques">Libre</span>'
        }
      </div>
    `;
  }).join('');

  contenedor.querySelectorAll('.btn-eliminar-bloque').forEach(boton => {
    boton.addEventListener('click', (e) => {
      const index = parseInt(e.currentTarget.dataset.index, 10);
      eliminarBloqueHorario(index);
    });
  });

  actualizarMetricaHoras();
}

function actualizarMetricaHoras() {
  const tagHoras = document.getElementById('horas-promedio-tag');
  if (!tagHoras) return;
  const promedio = calcularHorasDisponibles(horariosLocales);
  tagHoras.textContent = `${promedio} hrs/día disp.`;
}

async function guardarPerfil(e) {
  e.preventDefault();
  const estadoMsg = document.getElementById('estado-guardado');
  const btnGuardar = document.getElementById('btn-guardar-perfil');

  guardarEnLocalStorage();

  if (!usuarioActual?.id) return;

  try {
    btnGuardar.disabled = true;
    estadoMsg.className = 'estado-mensaje';
    estadoMsg.textContent = 'Guardando en servidor...';

    const nombre = document.getElementById('perfil-nombre').value.trim();
    const apellido = document.getElementById('perfil-apellido').value.trim();
    const objetivo = document.getElementById('perfil-objetivo').value.trim();
    const nivel_procrastinacion = parseInt(document.getElementById('perfil-procrastinacion').value, 10);
    const horas_disponibles = calcularHorasDisponibles(horariosLocales);
    const horariosValidados = validarHorarios(horariosLocales);

    await guardarPerfilEstudio(usuarioActual.id, {
      nombre, apellido, objetivo, nivel_procrastinacion, horas_disponibles, horarios: horariosValidados
    });

    estadoMsg.className = 'estado-mensaje exito';
    estadoMsg.textContent = '✓ Guardado exitosamente.';
    setTimeout(() => { estadoMsg.textContent = ''; }, 3000);
  } catch (error) {
    console.error('Error al guardar en backend:', error);
    estadoMsg.className = 'estado-mensaje error';
    estadoMsg.textContent = `Guardado localmente (${error.message})`;
  } finally {
    btnGuardar.disabled = false;
  }
}

function mostrarErrorHorario(mensaje) {
  const errorEl = document.getElementById('error-horario');
  if (errorEl) { errorEl.textContent = mensaje; errorEl.hidden = false; }
}

function ocultarErrorHorario() {
  const errorEl = document.getElementById('error-horario');
  if (errorEl) { errorEl.hidden = true; errorEl.textContent = ''; }
}