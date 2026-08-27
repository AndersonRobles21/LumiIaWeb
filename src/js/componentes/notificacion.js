// notificacion.js
// Componente simple para mostrar notificaciones en pantalla

export function showNotification(message, type = 'error', timeout = 5000) {
  const existing = document.getElementById('lumi-notificacion');
  if (existing) existing.remove();

  const div = document.createElement('div');
  div.id = 'lumi-notificacion';
  div.className = `lumi-notificacion ${type}`;
  div.innerText = message;

  document.body.appendChild(div);

  // Auto cerrar
  if (timeout > 0) {
    setTimeout(() => {
      div.classList.add('hide');
      setTimeout(() => div.remove(), 300);
    }, timeout);
  }
}

export function clearNotification() {
  const el = document.getElementById('lumi-notificacion');
  if (el) el.remove();
}
