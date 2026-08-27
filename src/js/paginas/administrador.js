document.addEventListener('DOMContentLoaded', () => {
    // 1. Referencias a los botones del Sidebar
    const btnDashboard = document.getElementById('btn-nav-dashboard');
    const btnReportes = document.getElementById('btn-nav-reportes');
    const btnLogout = document.getElementById('btn-logout');

    // 2. Referencias a las Secciones (Vistas)
    const vistaDashboard = document.getElementById('vista-dashboard');
    const vistaReportes = document.getElementById('vista-reportes');

    // 3. Función para alternar vistas
    function mostrarVista(vistaAMostrar, botonActivo) {
        // Ocultar todas las vistas
        vistaDashboard.style.display = 'none';
        vistaReportes.style.display = 'none';

        // Quitar la clase active de los botones
        btnDashboard.classList.remove('active');
        btnReportes.classList.remove('active');

        // Mostrar la vista seleccionada y activar su botón
        vistaAMostrar.style.display = 'block';
        botonActivo.classList.add('active');
    }

    // Eventos de navegación
    if (btnDashboard) {
        btnDashboard.addEventListener('click', () => {
            mostrarVista(vistaDashboard, btnDashboard);
        });
    }

    if (btnReportes) {
        btnReportes.addEventListener('click', () => {
            mostrarVista(vistaReportes, btnReportes);
            inicializarGraficas(); // Carga las gráficas al abrir la sección
        });
    }

    // 4. Lógica de Cerrar Sesión
    if (btnLogout) {
        btnLogout.addEventListener('click', () => {
            const confirmar = confirm('¿Estás seguro de que deseas cerrar sesión?');
            if (confirmar) {
                // Limpia el almacenamiento local/sesión
                localStorage.clear();
                sessionStorage.clear();
                // Redirige al login
                window.location.href = 'login.html';
            }
        });
    }

    // 5. Renderizado de Gráficas con Chart.js
    let graficasCargadas = false;

    function inicializarGraficas() {
        if (graficasCargadas) return; // Evita duplicar las gráficas si se da clic varias veces

        // Gráfica 1: Progreso de Estudiantes
        const ctxProgreso = document.getElementById('chartProgreso')?.getContext('2d');
        if (ctxProgreso) {
            new Chart(ctxProgreso, {
                type: 'line',
                data: {
                    labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'],
                    datasets: [{
                        label: 'Progreso Promedio (%)',
                        data: [40, 55, 62, 70, 78, 85],
                        borderColor: '#00f2fe',
                        backgroundColor: 'rgba(0, 242, 254, 0.1)',
                        fill: true,
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    plugins: { legend: { labels: { color: '#f8fafc' } } },
                    scales: {
                        x: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } },
                        y: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } }
                    }
                }
            });
        }

        // Gráfica 2: Uso de la Plataforma
        const ctxUso = document.getElementById('chartUso')?.getContext('2d');
        if (ctxUso) {
            new Chart(ctxUso, {
                type: 'bar',
                data: {
                    labels: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
                    datasets: [{
                        label: 'Horas de uso',
                        data: [12, 19, 15, 22, 18, 8, 5],
                        backgroundColor: '#7c3aed',
                        borderRadius: 6
                    }]
                },
                options: {
                    responsive: true,
                    plugins: { legend: { labels: { color: '#f8fafc' } } },
                    scales: {
                        x: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } },
                        y: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } }
                    }
                }
            });
        }

        graficasCargadas = true;
    }
});