/**
 * historial.js
 * Lógica funcional para la interfaz de 2 columnas (LUMI)
 */

import { obtenerUsuarioActual } from '../servicios/autenticacion.service.js';
import { obtenerHistorialIA } from '../servicios/ia.service.js';

export async function initHistorial() {
  const contenedorLista = document.getElementById('lista-conversaciones');
  if (!contenedorLista) return;

  // Asignar listeners a los elementos precargados en el HTML
  configurarSeleccionConversaciones();
  configurarBuscador();
  configurarChipsSugerencias();

  try {
    const usuario = await obtenerUsuarioActual();
    if (!usuario?.id) return;

    const historial = await obtenerHistorialIA(usuario.id);

    // Si existen datos reales en el backend, los renderizamos sin romper la UI
    if (historial && historial.length > 0) {
      renderizarConversacionesBackend(historial, contenedorLista);
    }
  } catch (error) {
    console.warn('Usando vista previa estática de conversaciones:', error);
  }
}

function configurarSeleccionConversaciones() {
  const items = document.querySelectorAll('.item-conversacion');
  const elTituloChat = document.getElementById('chat-titulo-tarea');

  items.forEach(elemento => {
    elemento.addEventListener('click', () => {
      items.forEach(el => el.classList.remove('activa'));
      elemento.classList.add('activa');

      const tituloItem = elemento.querySelector('h4')?.textContent;
      if (elTituloChat && tituloItem) {
        elTituloChat.textContent = tituloItem;
      }
    });
  });
}

function renderizarConversacionesBackend(historial, contenedor) {
  contenedor.innerHTML = `<div class="grupo-fecha-label">Recientes</div>`;

  historial.forEach((item, index) => {
    const esActiva = index === 0 ? 'activa' : '';
    const titulo = item.nombre || item.titulo || item.metodo_estudio || 'Consulta de estudio';
    const subtitulo = item.metodo_estudio ? `Método: ${item.metodo_estudio}` : 'Desarrollo de proyecto';
    const hora = item.fecha_creacion 
      ? new Date(item.fecha_creacion).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : 'Hoy';

    const itemHTML = `
      <div class="item-conversacion ${esActiva}" data-id="${item.id || index}">
        <div class="avatar-lumi-sm">🤖</div>
        <div class="info-conversacion">
          <h4>${titulo}</h4>
          <p>${subtitulo}</p>
        </div>
        <span class="hora-item">${hora}</span>
      </div>
    `;

    contenedor.insertAdjacentHTML('beforeend', itemHTML);
  });

  configurarSeleccionConversaciones();
}

function configurarBuscador() {
  const inputBuscador = document.getElementById('input-buscar-historial');
  if (!inputBuscador) return;

  inputBuscador.addEventListener('input', (e) => {
    const termino = e.target.value.toLowerCase();
    const items = document.querySelectorAll('.item-conversacion');

    items.forEach(item => {
      const coincidencia = item.textContent.toLowerCase().includes(termino);
      item.style.display = coincidencia ? 'flex' : 'none';
    });
  });
}

function configurarChipsSugerencias() {
  const chips = document.querySelectorAll('.chip-btn');
  chips.forEach(chip => {
    chip.addEventListener('click', () => {
      const texto = chip.textContent;
      console.log('Sugerencia seleccionada:', texto);
    });
  });
}

// Inicialización
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initHistorial);
} else {
  initHistorial();
}