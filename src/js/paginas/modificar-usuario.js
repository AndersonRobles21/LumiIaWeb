import { obtenerUsuarioActual } from '../servicios/autenticacion.service.js';
import { comprobarAdmin, obtenerUsuarioAdmin, actualizarUsuarioAdmin, eliminarUsuarioAdmin } from '../servicios/administrador.service.js';

const contenedor = document.getElementById('detalle-usuario');
const escapar = valor => String(valor ?? '').replace(/[&<>'"]/g, caracter => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[caracter]));
const formatearHora = hora => String(hora || '').slice(0, 5) || '--:--';
const ocultarCarga = () => document.getElementById('carga-detalle')?.remove();
const formatearHorarios = horarios => {
  if (!Array.isArray(horarios) || !horarios.length) return '<span class="dato-vacio">Sin horarios definidos</span>';
  return `<ul class="lista-horarios">${horarios.map(horario => `<li><span>${escapar(String(horario.dia || 'Día').charAt(0).toUpperCase() + String(horario.dia || 'Día').slice(1))}</span><strong>${formatearHora(horario.hora_inicio)} - ${formatearHora(horario.hora_fin)}</strong></li>`).join('')}</ul>`;
};

async function cargarDetalle() {
  const id = new URLSearchParams(window.location.search).get('id');
  if (!id) throw new Error('No se indicó un usuario.');
  const administrador = await obtenerUsuarioActual();
  if (!administrador?.id) throw new Error('La sesión no está autenticada.');
  await comprobarAdmin(administrador.id);
  const respuesta = await obtenerUsuarioAdmin(administrador.id, id);
  const envoltura = respuesta?.data || respuesta || {};
  const usuario = envoltura?.user || envoltura?.usuario || envoltura;
  const perfil = envoltura?.perfil_estudio || envoltura?.perfil || usuario?.perfil_estudio || usuario?.perfil || {};
  const foto = usuario.foto_perfil || usuario.avatar_url || perfil.foto_perfil || '';
  const horarios = envoltura?.horarios || perfil.horario || perfil.horarios || [];
  const estadisticas = envoltura?.estadisticas || usuario.estadisticas || {};
  const planes = envoltura?.planes_estudio || usuario.planes_estudio || [];
  const nombreCompleto = [usuario.nombre, usuario.apellido].filter(Boolean).join(' ') || 'Usuario LUMI';
  contenedor.innerHTML = `<div class="detalle-shell"><section class="detalle-hero"><a class="detalle-volver" href="administrador.html">← Volver al panel de administrador</a><div class="detalle-hero-contenido"><span class="detalle-kicker">ADMINISTRACIÓN LUMI</span><h1>Perfil del usuario</h1><p>Consulta la actividad y actualiza sus datos personales sin alterar su progreso.</p><img src="../assets/img/robot-educacion.png" alt="Asistente LUMI" class="detalle-robot"></div></section><section class="detalle-panel"><div class="detalle-encabezado"><div class="detalle-avatar">${foto ? `<img src="${escapar(foto)}" alt="Foto de perfil de ${escapar(nombreCompleto)}" class="foto-usuario-admin">` : '<span>U</span>'}</div><div><span class="detalle-kicker">USUARIO SELECCIONADO</span><h2>${escapar(nombreCompleto)}</h2><p>${escapar(usuario.email || 'Correo no disponible')}</p></div></div><div class="detalle-contenido"><form id="editar-usuario" class="detalle-edicion"><h3>Datos personales</h3><label>Nombre<input id="nombre" value="${escapar(usuario.nombre)}" required></label><label>Apellido<input id="apellido" value="${escapar(usuario.apellido)}"></label><button type="submit" class="boton-guardar">Guardar cambios</button></form><div class="detalle-informacion"><h3>Información del perfil</h3><div class="datos-grid"><p><span>Objetivo</span><strong>${escapar(perfil.objetivo || 'Sin definir')}</strong></p><p><span>Procrastinación</span><strong>${escapar(perfil.nivel_procrastinacion ?? 'Sin definir')}</strong></p><p><span>Horas disponibles</span><strong>${escapar(perfil.horas_disponibles ?? 'Sin definir')}</strong></p><p><span>Racha</span><strong>${escapar(usuario.racha ?? estadisticas.racha ?? perfil.racha ?? 0)} días</strong></p><p><span>Tareas completadas</span><strong>${escapar(usuario.tareas_completadas ?? estadisticas.tareas_completadas ?? perfil.tareas_completadas ?? 0)}</strong></p><p><span>Horas estudiadas</span><strong>${escapar(estadisticas.horas_estudio ?? 'Sin definir')}</strong></p><p class="dato-horarios"><span>Horarios</span>${formatearHorarios(horarios)}</p><p><span>Planes generados</span><strong>${planes.length}</strong></p></div></div></div><button type="button" class="boton-peligro" id="eliminar-usuario">Eliminar usuario</button></section></div>`;
  ocultarCarga();
  document.getElementById('editar-usuario').addEventListener('submit', async event => { event.preventDefault(); await actualizarUsuarioAdmin(administrador.id, id, { nombre: document.getElementById('nombre').value.trim(), apellido: document.getElementById('apellido').value.trim() }); alert('Nombre y apellido actualizados. Los demás datos se conservaron.'); });
  document.getElementById('eliminar-usuario').addEventListener('click', async () => { if (!confirm('¿Eliminar este usuario?')) return; await eliminarUsuarioAdmin(administrador.id, id); window.location.href = 'usuarios.html'; });
}

document.addEventListener('DOMContentLoaded', () => cargarDetalle().catch(error => { ocultarCarga(); contenedor.innerHTML = `<p>${escapar(error.message)}</p>`; }));
