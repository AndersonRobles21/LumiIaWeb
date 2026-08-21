/**
 * agregar-tarea.js
 * Lógica temporal de la página Agregar Tarea
 * Por ahora solo validamos y mostramos los datos.
 */

console.log('agregar-tarea.js cargado');

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('formulario-tarea');

  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    validarYGuardar();
  });
});

function validarYGuardar() {
  const titulo = document.getElementById('titulo').value.trim();
  const descripcion = document.getElementById('descripcion').value.trim();
  const prioridad = document.getElementById('prioridad').value;
  const fecha = document.getElementById('fecha').value;
  const metodo = document.getElementById('metodo').value;

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

  // Datos temporales
  const tarea = {
    titulo,
    descripcion: descripcion || null,
    prioridad,
    fecha: fecha || null,
    metodo: metodo || null,
    completada: false,
    creadaEn: new Date().toISOString()
  };

  console.log('Tarea creada (temporal):', tarea);

  // Guardar en localStorage (temporal)
  const tareasGuardadas = JSON.parse(localStorage.getItem('lumi_tareas') || '[]');
  tarea.id = Date.now(); // id temporal
  tareasGuardadas.push(tarea);
  localStorage.setItem('lumi_tareas', JSON.stringify(tareasGuardadas));

  console.log('Tarea guardada temporalmente:', tarea);

  alert('¡Tarea guardada correctamente!');

  // Redirigir a la lista de tareas
  window.location.href = 'tareas.html';
  // Más adelante aquí guardaremos en el servicio real
  // y redirigiremos a tareas.html
  // window.location.href = 'tareas.html';
}
