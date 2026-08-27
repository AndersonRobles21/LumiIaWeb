const params = new URLSearchParams(location.search);
const planId = params.get('plan_id');
const metodoActual = params.get('metodo');

document.querySelectorAll('[data-metodo]').forEach(tarjeta => {
  tarjeta.addEventListener('click', () => {
    if (!planId) return;
    const metodo = tarjeta.dataset.metodo;
    localStorage.setItem(`lumi_metodo_plan_${planId}`, metodo);
    location.href = `historial.html?plan_id=${encodeURIComponent(planId)}`;
  });
  tarjeta.classList.toggle('seleccionado', tarjeta.dataset.metodo === metodoActual);
});

document.getElementById('volver-historial').href = planId ? `historial.html?plan_id=${encodeURIComponent(planId)}` : 'historial.html';
