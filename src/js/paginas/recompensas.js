import { obtenerUsuarioActual } from '../servicios/autenticacion.service.js';
import { obtenerPlanesUsuarioBD } from '../servicios/planes.service.js';
import { obtenerGamificacionLocal } from '../utilidades/progreso-tareas.js';

const DEFINICIONES_LOGROS = [
  ['trofeo_bronce.png', 'Primer paso', 'Completa tu primera tarea.', datos => datos.tareasCompletadas >= 1],
  ['fuego.png', 'Llama encendida', 'Mantén una racha de 3 días.', datos => datos.racha >= 3],
  ['calendario_10.png', 'Constancia diez', 'Mantén una racha de 10 días.', datos => datos.racha >= 10],
  ['luna_estrellas.png', 'Noche de estudio', 'Acumula una hora de estudio.', datos => datos.horas >= 1],
  ['reloj_7.png', 'Ritmo constante', 'Acumula 7 horas de estudio.', datos => datos.horas >= 7],
  ['cerebro.png', 'Mente activa', 'Crea tu primer plan de estudio.', datos => datos.totalPlanes >= 1],
  ['cohete.png', 'Despegue', 'Crea cinco planes de estudio.', datos => datos.totalPlanes >= 5],
  ['corona.png', 'Plan maestro', 'Completa diez tareas.', datos => datos.tareasCompletadas >= 10],
  ['espadas.png', 'Desafío superado', 'Completa veinte tareas.', datos => datos.tareasCompletadas >= 20],
  ['estrella_azul.png', 'Explorador', 'Completa tres planes.', datos => datos.tareasCompletadas >= 3],
  ['estrella_verde.png', 'Avance brillante', 'Alcanza el nivel 3.', datos => datos.nivel >= 3],
  ['medalla_oro.png', 'Excelencia', 'Alcanza el nivel 5.', datos => datos.nivel >= 5],
  ['mundo.png', 'Horizonte amplio', 'Acumula 25 horas de estudio.', datos => datos.horas >= 25],
  ['puntero.png', 'En el objetivo', 'Completa cinco tareas.', datos => datos.tareasCompletadas >= 5],
  ['rayo.png', 'Enfoque veloz', 'Mantén una racha de 7 días.', datos => datos.racha >= 7],
  ['buho_noturno.png', 'Búho nocturno', 'Estudia durante una sesión nocturna.', datos => datos.horasNocturnas >= 1]
];

let logrosDisponibles = [];

document.addEventListener('DOMContentLoaded', inicializarProgreso);

async function inicializarProgreso() {
  const local = obtenerGamificacionLocal();
  let planes = [];
  try {
    const usuario = await obtenerUsuarioActual();
    if (usuario?.id) planes = await obtenerPlanesUsuarioBD(usuario.id);
  } catch (error) {
    console.warn('No se pudieron cargar los planes para Tu Progreso:', error.message);
  }

  const datosBase = { tareasCompletadas: local.tareas_completadas, racha: local.racha, totalPlanes: planes.length || obtenerPlanesLocales(), ...obtenerHorasGuardadas() };
  const desbloqueadosIniciales = DEFINICIONES_LOGROS.filter(([, , , criterio]) => criterio({ ...datosBase, nivel: 1 })).length;
  let xpTotal = (datosBase.tareasCompletadas * 20) + (datosBase.racha * 15) + (datosBase.totalPlanes * 25) + (desbloqueadosIniciales * 35);
  let nivel = Math.floor(xpTotal / 100) + 1;
  const totalDesbloqueados = DEFINICIONES_LOGROS.filter(([, , , criterio]) => criterio({ ...datosBase, nivel })).length;
  xpTotal = (datosBase.tareasCompletadas * 20) + (datosBase.racha * 15) + (datosBase.totalPlanes * 25) + (totalDesbloqueados * 35);
  nivel = Math.floor(xpTotal / 100) + 1;
  const datos = { ...datosBase, xpTotal, nivel };

  renderizarMetricas(datos);
  renderizarGraficoSemanal(datos.horas);
  renderizarLogros(DEFINICIONES_LOGROS.map(([imagen, nombre, descripcion, criterio], index) => ({ imagen, nombre, descripcion, desbloqueado: criterio(datos), xp: 35, index })));
}

function renderizarMetricas(datos) {
  establecerTexto('completadas', datos.tareasCompletadas);
  establecerTexto('tareas-faltantes', Math.max(0, datos.totalPlanes - datos.tareasCompletadas));
  establecerTexto('horas-estudio', `${datos.horas.toFixed(1)}h`);
  establecerTexto('racha-numero', datos.racha);
  establecerTexto('nivel', datos.nivel);
  establecerTexto('xp-actual', `${datos.xpTotal % 100} XP`);
  establecerTexto('mensaje-motivacional', datos.tareasCompletadas ? 'Tu constancia está dando frutos.' : 'Tu primer avance empieza hoy.');
  const barra = document.getElementById('barra-progreso');
  if (barra) barra.value = datos.xpTotal % 100;
}

function renderizarGraficoSemanal(horas) {
  const contenedor = document.getElementById('grafico-semanal');
  if (!contenedor) return;
  const valores = [0.2, 0.45, 0.7, 0.35, 0.85, 0.55, 0.25].map(factor => Math.max(0.05, horas * factor));
  const maximo = Math.max(...valores, 1);
  contenedor.innerHTML = valores.map((valor, indice) => `<div class="barra-dia"><i style="--altura-barra:${Math.max(8, (valor / maximo) * 140)}px" title="${valor.toFixed(1)} horas"></i><span>${['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'][indice]}</span></div>`).join('');
}

function renderizarLogros(logros) {
  const contenedor = document.getElementById('logros');
  const contador = document.getElementById('contador-logros');
  if (!contenedor) return;
  logrosDisponibles = logros;
  const desbloqueados = logros.filter(logro => logro.desbloqueado).length;
  if (contador) contador.textContent = `${desbloqueados}/${logros.length}`;
  contenedor.innerHTML = logros.map(logro => `<button class="insignia ${logro.desbloqueado ? '' : 'bloqueada'}" type="button" data-logro-index="${logro.index}" aria-pressed="false"><span class="insignia-icono"><img src="../assets/logros/${logro.imagen}" alt=""></span><strong>${escapar(logro.nombre)}</strong><small>${logro.desbloqueado ? 'Desbloqueada' : '🔒 Bloqueada'}</small></button>`).join('');
  contenedor.querySelectorAll('[data-logro-index]').forEach(insignia => insignia.addEventListener('click', () => seleccionarLogro(Number(insignia.dataset.logroIndex))));
}

function seleccionarLogro(indice) {
  const logro = logrosDisponibles[indice];
  if (!logro) return;
  document.querySelectorAll('.insignia').forEach(insignia => insignia.setAttribute('aria-pressed', String(insignia.dataset.logroIndex === String(indice))));
  establecerTexto('inspector-nombre', logro.nombre);
  establecerTexto('inspector-descripcion', logro.descripcion);
  establecerTexto('inspector-estado', `Estado: ${logro.desbloqueado ? 'Desbloqueada' : 'Bloqueada'}`);
  establecerTexto('inspector-recompensa', `Recompensa: ${logro.desbloqueado ? '35 XP' : 'Completa el objetivo'}`);
  establecerTexto('inspector-xp', `XP: ${logro.xp}`);
}

function obtenerPlanesLocales() {
  try { return JSON.parse(localStorage.getItem('lumi_tareas') || '[]').length; } catch { return 0; }
}

function obtenerHorasGuardadas() {
  let horas = 0;
  try {
    const progreso = JSON.parse(localStorage.getItem('lumi_progreso_tareas') || '{}');
    horas = Object.values(progreso).reduce((total, estado) => total + Number(estado?.horas_estudio || 0), 0);
  } catch { /* Usa el respaldo cero si el almacenamiento no es válido. */ }
  horas += Number(localStorage.getItem('lumi_horas_estudio') || 0);
  return { horas, horasNocturnas: Number(localStorage.getItem('lumi_horas_nocturnas') || 0) };
}

function establecerTexto(id, valor) {
  const elemento = document.getElementById(id);
  if (elemento) elemento.textContent = valor == null || valor === '' ? 'No disponible' : valor;
}

function escapar(valor) {
  return String(valor).replace(/[&<>"']/g, caracter => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[caracter]);
}
