import { supabase } from '../config/supabase.js';
import { obtenerPlanesUsuarioBD } from '../servicios/planes.service.js';
import { obtenerUsuarioActual } from '../servicios/autenticacion.service.js';

let listaPlanesGlobal = [];

export async function initHistorial() {
  const contenedorLista = document.getElementById('lista-conversaciones');
  if (!contenedorLista) return;

  configurarBuscador();
  configurarChipsSugerencias();

  try {
    let usuarioId = null;

    // Obtener id del usuario actual
    try {
      const usuario = await obtenerUsuarioActual();
      usuarioId = usuario?.id;
    } catch {
      const { data: { session } } = await supabase.auth.getSession();
      usuarioId = session?.user?.id;
    }

    if (!usuarioId) {
      contenedorLista.innerHTML = `<p style="padding: 1rem; color: #8a8f9d;">Inicia sesión para ver tu historial de tareas.</p>`;
      return;
    }

    // Consulta real a Supabase (tablas planes_estudio y actividades)
    const planes = await obtenerPlanesUsuarioBD(usuarioId);
    listaPlanesGlobal = planes;

    if (planes && planes.length > 0) {
      renderizarListaPlanes(planes, contenedorLista);
      // Seleccionar automáticamente el primer plan
      seleccionarPlan(planes[0]);
    } else {
      contenedorLista.innerHTML = `<p style="padding: 1rem; color: #8a8f9d;">No tienes tareas registradas en la base de datos.</p>`;
    }

  } catch (error) {
    console.error('Error al cargar historial desde Supabase:', error);
    contenedorLista.innerHTML = `<p style="padding: 1rem; color: #8a8f9d;">Error al sincronizar con la base de datos.</p>`;
  }
}

function renderizarListaPlanes(planes, contenedor) {
  contenedor.innerHTML = `<div class="grupo-fecha-label">Tus tareas guardadas</div>`;

  planes.forEach((plan, index) => {
    const esActiva = index === 0 ? 'activa' : '';
    const titulo = plan.nombre || 'Tarea sin nombre';
    const descripcion = plan.descripcion || 'Sin descripción';
    const hora = plan.fecha_creacion 
      ? new Date(plan.fecha_creacion).toLocaleDateString([], { month: 'short', day: 'numeric' })
      : 'Hoy';

    const itemHTML = `
      <div class="item-conversacion ${esActiva}" data-id="${plan.id}" data-index="${index}">
        <div class="avatar-lumi-sm">🤖</div>
        <div class="info-conversacion">
          <h4>${titulo}</h4>
          <p>${descripcion}</p>
        </div>
        <span class="hora-item">${hora}</span>
      </div>
    `;

    contenedor.insertAdjacentHTML('beforeend', itemHTML);
  });

  configurarEventosSeleccion();
}

function configurarEventosSeleccion() {
  const items = document.querySelectorAll('.item-conversacion');

  items.forEach(elemento => {
    elemento.addEventListener('click', () => {
      items.forEach(el => el.classList.remove('activa'));
      elemento.classList.add('activa');

      const index = elemento.getAttribute('data-index');
      if (listaPlanesGlobal[index]) {
        seleccionarPlan(listaPlanesGlobal[index]);
      }
    });
  });
}

function seleccionarPlan(plan) {
  const elTitulo = document.getElementById('chat-titulo-tarea');
  const elSaludo = document.getElementById('texto-saludo-lumi');
  const elMetodo = document.getElementById('nombre-metodo-activo');
  const elHora = document.getElementById('hora-plan');
  const contenedorPasos = document.getElementById('contenedor-pasos-historial');

  if (elTitulo) elTitulo.textContent = plan.nombre || 'Plan de Estudio';
  if (elMetodo) elMetodo.textContent = plan.metodo_estudio || 'Pomodoro (Sugerido por IA)';
  
  if (elSaludo) {
    elSaludo.textContent = `¡Hola! Aquí tienes los detalles y actividades registradas para "${plan.nombre}". ¿Quieres repasar algún punto?`;
  }

  if (elHora && plan.fecha_creacion) {
    elHora.textContent = new Date(plan.fecha_creacion).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  // Renderizar actividades asociadas de la base de datos
  if (contenedorPasos) {
    const actividades = plan.actividades || [];
    if (actividades.length > 0) {
      contenedorPasos.innerHTML = actividades.map((act, i) => `
        <div class="paso-card" style="margin-bottom: 0.75rem; padding: 0.85rem; background: rgba(255,255,255,0.04); border-radius: 8px; border-left: 3px solid #61dafb;">
          <strong style="color: #ffffff;">Actividad ${i + 1}: ${act.titulo || act.nombre}</strong>
          <p style="margin-top: 4px; font-size: 0.88rem; color: #b0b5c0;">${act.descripcion || 'Sin detalle de la actividad'}</p>
          ${act.fecha ? `<small style="color: #61dafb; display: block; margin-top: 4px;">📅 Fecha límite: ${act.fecha}</small>` : ''}
        </div>
      `).join('');
    } else {
      contenedorPasos.innerHTML = `
        <div style="padding: 0.85rem; background: rgba(255,255,255,0.03); border-radius: 8px; font-size: 0.88rem; color: #b0b5c0;">
          📌 <strong>Descripción registrada:</strong> ${plan.descripcion || 'Sin información adicional del plan.'}
        </div>
      `;
    }
  }
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
      console.log('Acción rápida:', chip.dataset.accion);
    });
  });
}

// Inicialización
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initHistorial);
} else {
  initHistorial();
}