/**
 * modificar-usuario.js
 * Lógica temporal de la página "Modificar Usuario"
 * Solo validamos y mostramos los datos por ahora.
 */

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('formulario-usuario');
  const nombreInput = document.getElementById('nombre');
  const objetivoSelect = document.getElementById('objetivo');
  const horasSelect = document.getElementById('horas-estudio');
  const metodosRadios = document.querySelectorAll('input[name="metodo"]');

  // Resaltar visualmente el método seleccionado
  metodosRadios.forEach(radio => {
    radio.addEventListener('change', () => {
      // Quitar clase de todos
      document.querySelectorAll('.metodo').forEach(m => {
        m.classList.remove('seleccionado');
      });
      // Agregar clase al label del radio marcado
      if (radio.checked) {
        radio.closest('.metodo').classList.add('seleccionado');
      }
    });
  });

  // Cuando se envía el formulario
  form.addEventListener('submit', (e) => {
    e.preventDefault(); // Evita que recargue la página
    validarYContinuar();
  });

  function validarYContinuar() {
    const nombre = nombreInput.value.trim();
    const objetivo = objetivoSelect.value;
    const horas = horasSelect.value;
    const metodoSeleccionado = document.querySelector('input[name="metodo"]:checked');

    // Validaciones
    if (!nombre) {
      alert('Por favor escribe tu nombre completo');
      nombreInput.focus();
      return;
    }

    if (!objetivo) {
      alert('Selecciona tu objetivo principal');
      objetivoSelect.focus();
      return;
    }

    if (!horas) {
      alert('Selecciona cuántas horas puedes estudiar');
      horasSelect.focus();
      return;
    }

    if (!metodoSeleccionado) {
      alert('Elige un método de estudio preferido');
      return;
    }

    // Todo correcto → datos temporales
    const datos = {
      nombre: nombre,
      objetivo: objetivo,
      horasEstudio: horas,
      metodo: metodoSeleccionado.value
    };

    console.log('Datos guardados temporalmente:', datos);
    // Mensaje de confirmación
    // Guardar datos del perfil en localStorage (temporal)
    const perfil = {
      nombre: nombre,
      objetivo: objetivo,
      objetivoTexto: objetivoSelect.options[objetivoSelect.selectedIndex].text,
      horas: horas,
      horasTexto: horasSelect.options[horasSelect.selectedIndex].text,
      metodo: metodoSeleccionado.value
    };

    localStorage.setItem('lumi_perfil', JSON.stringify(perfil));

    console.log('Perfil guardado temporalmente:', perfil);

    // Redirección al dashboard
    window.location.href = 'dashboard.html';
    // Redirección temporal al dashboard
    window.location.href = 'dashboard.html';

  }
});
