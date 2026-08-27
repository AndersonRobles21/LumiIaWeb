const params = new URLSearchParams(location.search);
const planId = params.get('plan_id');
const metodo = document.body.dataset.metodo;
const volver = document.getElementById('volver-historial');
if (volver) volver.href = planId ? `historial.html?plan_id=${encodeURIComponent(planId)}` : 'historial.html';

const formatear = segundos => `${String(Math.floor(segundos / 60)).padStart(2, '0')}:${String(segundos % 60).padStart(2, '0')}`;
let segundos = 25 * 60;
let temporizador = null;
let segundosTranscurridos = 0;
const reloj = document.getElementById('reloj');
const actualizarReloj = () => { if (reloj) reloj.textContent = formatear(segundos); };

function guardarTiempoSesion() {
  if (!segundosTranscurridos) return;
  const horasPrevias = Number(localStorage.getItem('lumi_horas_estudio') || 0);
  localStorage.setItem('lumi_horas_estudio', String(horasPrevias + (segundosTranscurridos / 3600)));
  segundosTranscurridos = 0;
}

document.getElementById('iniciar')?.addEventListener('click', () => {
  if (temporizador) return;
  temporizador = setInterval(() => { segundos = Math.max(0, segundos - 1); segundosTranscurridos += 1; actualizarReloj(); if (!segundos) { clearInterval(temporizador); temporizador = null; guardarTiempoSesion(); } }, 1000);
});
document.getElementById('pausar')?.addEventListener('click', () => { clearInterval(temporizador); temporizador = null; guardarTiempoSesion(); });
document.getElementById('reiniciar')?.addEventListener('click', () => { clearInterval(temporizador); temporizador = null; guardarTiempoSesion(); segundos = 25 * 60; actualizarReloj(); });
document.getElementById('respuesta')?.addEventListener('click', event => { document.getElementById('respuesta-texto').hidden = false; event.currentTarget.hidden = true; });
document.querySelectorAll('[data-dificultad]').forEach(boton => boton.addEventListener('click', () => { document.getElementById('estado-repaso').textContent = `Marcado como ${boton.dataset.dificultad}.`; }));
document.getElementById('hecho')?.addEventListener('click', () => { document.getElementById('estado-feynman').textContent = 'Explicación guardada para esta sesión.'; });
if (metodo === 'pomodoro') actualizarReloj();
