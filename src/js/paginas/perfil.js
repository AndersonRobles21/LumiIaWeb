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
    
    let datosHorarios = [];
    let datosPerfil = {};
    let datosUsuario = {};

    // 1. Intentar cargar desde Backend
    if (usuarioActual?.id) {
      const respuestaApi = await obtenerUsuarioConPerfil(usuarioActual.id);
      const datosRespuesta = respuestaApi?.data || respuestaApi || {};
      
      datosUsuario = datosRespuesta?.usuario || datosRespuesta?.user || datosRespuesta;
      datosPerfil = datosRespuesta?.perfil_estudio || datosRespuesta?.perfil || {};

      // EXTRAER HORARIOS DE TODAS LAS ESTRUCTURAS POSIBLES DEL BACKEND
      datosHorarios = datosRespuesta?.horarios ||
                      datosPerfil?.horarios ||
                      datosPerfil?.horario || [];

      document.getElementById('perfil-nombre').value = datosUsuario?.nombre || usuarioActual.nombre || '';
      document.getElementById('perfil-apellido').value = datosUsuario?.apellido || usuarioActual.apellido || '';
      document.getElementById('perfil-objetivo').value = datosPerfil?.objetivo || '';
      document.getElementById('perfil-procrastinacion').value = datosPerfil?.nivel_procrastinacion || '3';

      const nombreDisplay = datosUsuario?.nombre || usuarioActual.nombre || 'Usuario';
      document.getElementById('avatar-nombre-display').textContent = nombreDisplay;
      document.getElementById('perfil-avatar').textContent = nombreDisplay.charAt(0).toUpperCase();
      document.getElementById('nombre-usuario-visible').textContent = datosUsuario?.nombre || 'No disponible';
      document.getElementById('apellido-usuario-visible').textContent = datosUsuario?.apellido || 'No disponible';
    }

    // 2. Prioridad inteligente de horarios: localStorage vs Backend
    const localCache = JSON.parse(localStorage.getItem('lumi_horarios_estudio') || '{}');
    const horariosGuardadosLocal = localCache.horarios || [];

    if (usuarioActual?.id && Array.isArray(datosHorarios) && datosHorarios.length > 0) {
      horariosLocales = normalizarHorariosPerfil(datosHorarios);
    } else if (Array.isArray(horariosGuardadosLocal) && horariosGuardadosLocal.length > 0) {
      horariosLocales = horariosGuardadosLocal;
    } else {
      horariosLocales = [];
    }

    renderizarSemana();
    cargarFotoPerfil();
  } catch (error) {
    console.error('Error al cargar datos del perfil:', error);
    // En caso de fallo de red, intentar rescatar lo que haya en localStorage
    try {
      const localCache = JSON.parse(localStorage.getItem('lumi_horarios_estudio') || '{}');
      horariosLocales = localCache.horarios || [];
      renderizarSemana();
    } catch (e) {
      horariosLocales = [];
    }
    mostrarErrorHorario('No se pudieron recuperar los datos completos del servidor (usando modo local).');
  }
}

function inicializarEventos() {
  const btnAgregar = document.getElementById('btn-agregar-horario');
  const formulario = document.getElementById('formulario-perfil');
  const btnEditarNombre = document.getElementById('btn-editar-nombre');
  const btnCancelarNombre = document.getElementById('btn-cancelar-nombre');
  const btnGuardarNombre = document.getElementById('btn-guardar-nombre');
  const inputFoto = document.getElementById('perfil-foto');

  if (btnAgregar) btnAgregar.addEventListener('click', agregarBloqueHorario);
  if (formulario) formulario.addEventListener('submit', guardarPerfil);
  if (btnEditarNombre) btnEditarNombre.addEventListener('click', () => alternarEditorNombre(true));
  if (btnCancelarNombre) btnCancelarNombre.addEventListener('click', cancelarEdicionNombre);
  if (btnGuardarNombre) btnGuardarNombre.addEventListener('click', guardarNombreDesdeEditor);
  if (inputFoto) inputFoto.addEventListener('change', previsualizarFotoPerfil);
}

function cargarFotoPerfil() {
  const foto = localStorage.getItem('lumi_foto_perfil');
  if (foto) mostrarFotoPerfil(foto);
}

function previsualizarFotoPerfil(evento) {
  const archivo = evento.target.files?.[0];
  if (!archivo) return;
  if (!archivo.type.startsWith('image/')) return;
  const lector = new FileReader();
  lector.addEventListener('load', () => {
    const foto = String(lector.result);
    localStorage.setItem('lumi_foto_perfil', foto);
    mostrarFotoPerfil(foto);
  });
  lector.readAsDataURL(archivo);
}

function mostrarFotoPerfil(foto) {
  const avatar = document.getElementById('perfil-avatar');
  const preview = document.getElementById('perfil-foto-preview');
  if (avatar) { avatar.textContent = ''; avatar.style.backgroundImage = `url("${foto}")`; avatar.classList.add('avatar-con-foto'); }
  if (preview) { preview.src = foto; preview.hidden = false; }
}

function alternarEditorNombre(visible) {
  document.getElementById('editor-nombre').hidden = !visible;
  document.getElementById('btn-editar-nombre').hidden = visible;
  if (visible) document.getElementById('perfil-nombre').focus();
}

function cancelarEdicionNombre() {
  aplicarNombreVisible();
  alternarEditorNombre(false);
}

async function guardarNombreDesdeEditor() {
  await guardarPerfil({ preventDefault: () => {} });
  if (document.getElementById('estado-guardado')?.classList.contains('exito')) alternarEditorNombre(false);
}

function aplicarNombreVisible() {
  const nombre = document.getElementById('perfil-nombre').value.trim();
  const apellido = document.getElementById('perfil-apellido').value.trim();
  document.getElementById('nombre-usuario-visible').textContent = nombre || 'No disponible';
  document.getElementById('apellido-usuario-visible').textContent = apellido || 'No disponible';
  document.getElementById('avatar-nombre-display').textContent = nombre || 'Usuario';
  document.getElementById('perfil-avatar').textContent = (nombre || 'U').charAt(0).toUpperCase();
}

function agregarBloqueHorario() {
  ocultarErrorHorario();

  const diaSelect = document.getElementById('horario-dia');
  const inicioInput = document.getElementById('horario-inicio');
  const finInput = document.getElementById('horario-fin');
  const inicioPeriodo = document.getElementById('horario-inicio-periodo');
  const finPeriodo = document.getElementById('horario-fin-periodo');

  const dia = diaSelect.value;
  const hora_inicio = convertirHora24(inicioInput.value, inicioPeriodo.value);
  const hora_fin = convertirHora24(finInput.value, finPeriodo.value);

  if (!hora_inicio || !hora_fin) {
    mostrarErrorHorario('Selecciona una hora de inicio y fin válidas.');
    return;
  }

  const nuevoHorario = { dia, hora_inicio, hora_fin };
  const horariosSimulados = [...horariosLocales, nuevoHorario];

  try {
    validarHorarios(horariosSimulados);
    horariosLocales = horariosSimulados;
    guardarEnLocalStorage();
    
    inicioInput.value = '';
    finInput.value = '';
    
    renderizarSemana();
  } catch (error) {
    mostrarErrorHorario(error.message);
  }
}

function eliminarBloqueHorario(index) {
  if (!window.confirm('¿Eliminar este bloque de horario?')) return;
  
  horariosLocales.splice(index, 1);
  guardarEnLocalStorage();
  renderizarSemana();
}

function convertirHora24(hora12, periodo) {
  let hora = Number(hora12);
  if (hora === 12) hora = 0;
  if (periodo === 'PM') hora += 12;
  return `${String(hora).padStart(2, '0')}:00`;
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

  if (!usuarioActual?.id) return;

  try {
    if (btnGuardar) btnGuardar.disabled = true;
    if (estadoMsg) {
      estadoMsg.className = 'estado-mensaje';
      estadoMsg.textContent = 'Guardando en servidor...';
    }

    const nombre = document.getElementById('perfil-nombre').value.trim();
    const apellido = document.getElementById('perfil-apellido').value.trim();
    const objetivo = document.getElementById('perfil-objetivo').value.trim();
    const nivel_procrastinacion = parseInt(document.getElementById('perfil-procrastinacion').value, 10);
    const horas_disponibles = calcularHorasDisponibles(horariosLocales);

    const horariosPayload = horariosLocales.map(h => ({
      dia: String(h.dia ?? '').trim(),
      hora_inicio: String(h.hora_inicio ?? '').trim(),
      hora_fin: String(h.hora_fin ?? '').trim()
    }));

    await guardarPerfilEstudio(usuarioActual.id, {
      nombre,
      apellido,
      objetivo,
      nivel_procrastinacion,
      horas_disponibles,
      horario: horariosPayload
    });

    const respuestaActualizada = await obtenerUsuarioConPerfil(usuarioActual.id);
    aplicarDatosPerfil(respuestaActualizada);
    guardarEnLocalStorage();

    if (estadoMsg) {
      estadoMsg.className = 'estado-mensaje exito';
      estadoMsg.textContent = '✓ Guardado exitosamente en la nube.';
      setTimeout(() => { estadoMsg.textContent = ''; }, 3000);
    }
  } catch (error) {
    console.error('Error al guardar en backend:', error);
    if (estadoMsg) {
      estadoMsg.className = 'estado-mensaje error';
      estadoMsg.textContent = `Error al guardar (${error.message})`;
    }
  } finally {
    if (btnGuardar) btnGuardar.disabled = false;
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

function normalizarHorariosPerfil(horarios) {
  return horarios.map(horario => ({
    ...horario,
    dia: horario.dia || DIAS_SEMANA[Number(horario.dia_semana)] || horario.dia_semana
  })).filter(horario => horario.dia);
}

function aplicarDatosPerfil(respuestaApi) {
  const datosRespuesta = respuestaApi?.data || respuestaApi || {};
  const datosUsuario = datosRespuesta?.usuario || datosRespuesta?.user || datosRespuesta;
  const datosPerfil = datosRespuesta?.perfil_estudio || datosRespuesta?.perfil || {};
  const datosHorarios = datosRespuesta?.horarios || datosPerfil?.horarios || datosPerfil?.horario || [];

  document.getElementById('perfil-nombre').value = datosUsuario?.nombre || '';
  document.getElementById('perfil-apellido').value = datosUsuario?.apellido || '';
  document.getElementById('perfil-objetivo').value = datosPerfil?.objetivo || '';
  if (datosPerfil?.nivel_procrastinacion != null) document.getElementById('perfil-procrastinacion').value = datosPerfil.nivel_procrastinacion;
  if (Array.isArray(datosHorarios)) horariosLocales = normalizarHorariosPerfil(datosHorarios);
  const nombre = datosUsuario?.nombre || '';
  document.getElementById('avatar-nombre-display').textContent = nombre || 'Usuario';
  document.getElementById('perfil-avatar').textContent = (nombre || 'U').charAt(0).toUpperCase();
  document.getElementById('nombre-usuario-visible').textContent = nombre || 'No disponible';
  document.getElementById('apellido-usuario-visible').textContent = datosUsuario?.apellido || 'No disponible';
  renderizarSemana();
}