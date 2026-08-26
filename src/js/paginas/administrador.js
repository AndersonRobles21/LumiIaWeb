import { supabase } from '../config/supabase.js';

document.addEventListener('DOMContentLoaded', async () => {
  const ADMIN_EMAIL = 'juanjoseboca88@gmail.com';

  // 1. VERIFICACIÓN DE SEGURIDAD CORREGIDA (EVITA EL BUCLE DE REDIRECCIÓN)
  const localRole = localStorage.getItem('userRole');
  const localEmail = localStorage.getItem('userEmail')?.toLowerCase();

  let esAdmin = localRole === 'admin' && localEmail === ADMIN_EMAIL;

  if (!esAdmin) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session && session.user?.email?.toLowerCase() === ADMIN_EMAIL) {
        esAdmin = true;
      }
    } catch (e) {
      console.warn('Error al verificar sesión:', e);
    }
  }

  // Si no es administrador y está intentando acceder a la vista de administrador
  if (!esAdmin) {
    alert('Acceso no autorizado.');
    localStorage.clear();
    window.location.href = './login.html';
    return;
  }

  // 2. CONMUTACIÓN DE PANTALLAS (SIDEBAR)
  const btnDashboard = document.getElementById('btn-nav-dashboard');
  const btnReportes = document.getElementById('btn-nav-reportes');
  const btnUsuarios = document.getElementById('btn-nav-usuarios');

  const vistaDashboard = document.getElementById('vista-dashboard');
  const vistaReportes = document.getElementById('vista-reportes');

  let chartsInicializados = false;

  const desactivarBotones = () => {
    btnDashboard?.classList.remove('active');
    btnReportes?.classList.remove('active');
    btnUsuarios?.classList.remove('active');
  };

  if (btnDashboard) {
    btnDashboard.addEventListener('click', () => {
      desactivarBotones();
      btnDashboard.classList.add('active');
      if (vistaDashboard) vistaDashboard.style.display = 'block';
      if (vistaReportes) vistaReportes.style.display = 'none';
    });
  }

  if (btnReportes) {
    btnReportes.addEventListener('click', () => {
      desactivarBotones();
      btnReportes.classList.add('active');
      if (vistaDashboard) vistaDashboard.style.display = 'none';
      if (vistaReportes) vistaReportes.style.display = 'block';

      if (!chartsInicializados) {
        inicializarGraficas();
        chartsInicializados = true;
      }
    });
  }

  // 3. CERRAR SESIÓN
  const btnLogout = document.getElementById('btn-logout');
  if (btnLogout) {
    btnLogout.addEventListener('click', async () => {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.warn('Cierre de sesión local:', err);
      }
      localStorage.clear();
      window.location.href = './login.html';
    });
  }

  // 4. BÚSQUEDA Y ACCIONES DE LA TABLA
  const inputBuscar = document.getElementById('input-buscar');
  const tablaBody = document.getElementById('tabla-body-estudiantes');

  if (inputBuscar && tablaBody) {
    inputBuscar.addEventListener('input', (e) => {
      const termino = e.target.value.toLowerCase().trim();
      const filas = tablaBody.querySelectorAll('tr');

      filas.forEach(fila => {
        const texto = fila.textContent.toLowerCase();
        fila.style.display = texto.includes(termino) ? '' : 'none';
      });
    });
  }

  if (tablaBody) {
    tablaBody.addEventListener('click', (e) => {
      const btn = e.target;
      if (btn.classList.contains('btn-desactivar')) {
        const fila = btn.closest('tr');
        const badge = fila.querySelector('span');

        if (btn.textContent.trim() === 'Desactivar') {
          btn.textContent = 'Activar';
          btn.style.backgroundColor = '#6c757d';
          if (badge) {
            badge.textContent = 'Inactivo';
            badge.className = 'badge-inactivo';
          }
        } else {
          btn.textContent = 'Desactivar';
          btn.style.backgroundColor = '#0d6efd';
          if (badge) {
            badge.textContent = 'Activo';
            badge.className = 'badge-activo';
          }
        }
      }

      if (btn.classList.contains('btn-eliminar')) {
        const fila = btn.closest('tr');
        if (confirm('¿Deseas eliminar este registro?')) {
          fila.remove();
        }
      }
    });
  }

  // 5. INICIALIZACIÓN DE GRÁFICAS (CHART.JS)
  function inicializarGraficas() {
    const ctxProgreso = document.getElementById('chartProgreso')?.getContext('2d');
    const ctxUso = document.getElementById('chartUso')?.getContext('2d');

    if (ctxProgreso && typeof Chart !== 'undefined') {
      new Chart(ctxProgreso, {
        type: 'line',
        data: {
          labels: ['Ago 19', 'Ago 20', 'Ago 21', 'Ago 22', 'Ago 23', 'Ago 24'],
          datasets: [
            {
              label: 'Completadas',
              data: [35, 60, 85, 110, 135, 160],
              borderColor: '#00d2ff',
              tension: 0.4
            },
            {
              label: 'En progreso',
              data: [15, 30, 45, 55, 65, 80],
              borderColor: '#9d4edd',
              tension: 0.4
            }
          ]
        },
        options: { responsive: true, maintainAspectRatio: false }
      });
    }

    if (ctxUso && typeof Chart !== 'undefined') {
      new Chart(ctxUso, {
        type: 'line',
        data: {
          labels: ['Ago 19', 'Ago 20', 'Ago 21', 'Ago 22', 'Ago 23', 'Ago 24'],
          datasets: [
            {
              label: 'Usuarios activos',
              data: [400, 650, 800, 900, 1100, 950],
              borderColor: '#00d2ff',
              tension: 0.4
            },
            {
              label: 'Sesiones',
              data: [300, 450, 500, 550, 750, 600],
              borderColor: '#9d4edd',
              tension: 0.4
            }
          ]
        },
        options: { responsive: true, maintainAspectRatio: false }
      });
    }
  }
});