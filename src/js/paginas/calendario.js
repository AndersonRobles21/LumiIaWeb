import { obtenerUsuarioActual } from '../servicios/autenticacion.service.js';
import { obtenerTareasDelUsuario } from '../servicios/tareas.service.js';

const lista = document.getElementById('lista-tareas');
const fecha = document.getElementById('fecha-calendario');
function renderizar(tareas) {
  const seleccion = fecha.value;
  const delDia = tareas.filter(tarea => !seleccion || String(tarea.fecha_entrega || '').startsWith(seleccion));
  lista.innerHTML = delDia.length ? delDia.map(tarea => `<article class="tarea-card"><h3>${tarea.nombre || 'Tarea'}</h3><p>${tarea.descripcion || ''}</p><span>${tarea.fecha_entrega || 'Sin fecha'}</span></article>`).join('') : '<p>No hay tareas para este día.</p>';
}
document.addEventListener('DOMContentLoaded', async () => { try { const usuario = await obtenerUsuarioActual(); const tareas = usuario?.id ? await obtenerTareasDelUsuario(usuario.id) : []; fecha.addEventListener('change', () => renderizar(tareas)); renderizar(tareas); } catch (error) { lista.innerHTML = `<p>${error.message}</p>`; } });
