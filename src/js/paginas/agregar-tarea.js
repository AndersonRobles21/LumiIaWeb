/**
 * agregar-tarea.js
 * Lógica de la página Agregar Tarea
 */

import { obtenerUsuarioActual } from '../servicios/autenticacion.service.js';
import { generarPlanIA } from '../servicios/ia.service.js';

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('formulario-tarea');

  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    validarYGuardar(form);
  });
});

async function validarYGuardar(form) {
  const titulo = document.getElementById('titulo').value.trim();
  const descripcion = document.getElementById('descripcion').value.trim();
  const prioridad = document.getElementById('prioridad').value;
  const fecha = document.getElementById('fecha').value;
  const metodo = document.getElementById('metodo').value;
  const enfoqueAdicional = document.getElementById('enfoque-adicional')?.value.trim() || '';

  // Validaciones
  if (!titulo) {
    alert('El título de la tarea es obligatorio');
    document.getElementById('titulo').focus();
    return;
  }

  if (!prioridad) {
    alert('Selecciona una prioridad');
    document.getElementById('prioridad').focus();
    return;
  }

  try {
    const boton = form.querySelector('button[type="submit"]');
    if (boton.disabled) return;
    boton.disabled = true;
    boton.dataset.textoOriginal = boton.textContent;
    boton.textContent = 'Generando plan...';
    const usuario = await obtenerUsuarioActual();
    if (!usuario?.id) throw new Error('La sesión no está autenticada.');

    if (!fecha) {
      alert('Selecciona una fecha de entrega');
      document.getElementById('fecha').focus();
      return;
    }

    const respuesta = await generarPlanIA({
      usuario_id: usuario.id,
      nombre: titulo,
      descripcion,
      fecha_entrega: fecha,
      metodo_estudio: metodo,
      dificultad: prioridad,
      enfoque_adicional: enfoqueAdicional,
    });

    if (!respuesta?.plan_id) throw new Error('El backend no devolvió el identificador del plan.');
    window.location.href = `guia-detalle.html?plan_id=${encodeURIComponent(respuesta.plan_id)}`;
  } catch (error) {
    alert(`No se pudo guardar la tarea: ${error.message}`);
  } finally {
    const boton = form.querySelector('button[type="submit"]');
    if (boton) { boton.disabled = false; boton.textContent = boton.dataset.textoOriginal || 'Generar plan'; }
  }
}
