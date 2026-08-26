document.addEventListener('DOMContentLoaded', async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const planId = urlParams.get('plan_id');

  // Buscar el plan en localStorage o cargarlo de la API
  const tareasLocales = JSON.parse(localStorage.getItem('lumi_tareas') || '[]');
  const tareaActual = tareasLocales[0]; // Carga la última tarea por defecto si no hay backend aún

  if (tareaActual) {
    document.getElementById('plan-titulo').textContent = tareaActual.titulo || 'Plan de Estudio';
    document.getElementById('plan-descripcion').textContent = tareaActual.descripcion || 'Sin descripción adicional';
    document.getElementById('metodo-actual-nombre').textContent = tareaActual.metodo_estudio || 'Pomodoro';

    // Pasos genéricos de prueba (se reemplazan con la respuesta de la IA)
    const pasos = [
      { num: 1, titulo: 'Revisión de requisitos y objetivos', duracion: '25 min' },
      { num: 2, titulo: 'Desarrollo de la estructura principal', duracion: '45 min' },
      { num: 3, titulo: 'Pruebas y ajustes finales', duracion: '30 min' }
    ];

    const contenedorPasos = document.getElementById('lista-pasos-container');
    if (contenedorPasos) {
      contenedorPasos.innerHTML = pasos.map(paso => `
        <div class="paso-card" style="margin-bottom: 1rem; padding: 1rem; border: 1px solid rgba(255,255,255,0.1); border-radius: 8px;">
          <h3>Paso ${paso.num}: ${paso.titulo}</h3>
          <small>⏱️ Tiempo estimado: ${paso.duracion}</small>
        </div>
      `).join('');
    }
  }

  // Evento para el botón de Cambiar Método
  document.getElementById('btn-cambiar-metodo')?.addEventListener('click', () => {
    alert('Función para alternar método de estudio (Pomodoro / Active Recall / Feynman).');
  });

  // Evento para el Modo Rayo (Enfoque rápido)
  document.getElementById('btn-modo-rayo')?.addEventListener('click', () => {
    alert('¡Modo Enfoque Rápido ⚡ iniciado!');
  });
});