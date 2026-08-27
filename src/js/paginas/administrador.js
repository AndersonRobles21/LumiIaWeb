import { obtenerUsuarioActual } from '../servicios/autenticacion.service.js';
import { obtenerUsuarioConPerfil } from '../servicios/usuario.service.js';
import { comprobarAdmin, obtenerResumenAdmin, obtenerUsuariosAdmin, obtenerTotalAdministradores, eliminarUsuarioAdmin } from '../servicios/administrador.service.js';

const escapar = valor => String(valor ?? '').replace(/[&<>'"]/g, caracter => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[caracter]));
const extraerUsuarios = respuesta => {
    const datos = respuesta?.data || respuesta;
    return datos?.users || datos?.usuarios || (Array.isArray(datos) ? datos : []);
};
let usuariosActuales = [];
let ordenUsuarios = 'nombre-asc';

function mostrarValor(ids, datos, claves) {
    const valor = claves.map(clave => datos?.[clave]).find(valorEncontrado => valorEncontrado !== undefined && valorEncontrado !== null);
    ids.forEach(id => {
        const elemento = document.getElementById(id);
        if (!elemento) return;
        const tarjeta = elemento.closest('.tarjeta');
        if (valor === undefined || valor === null || valor === '') {
            tarjeta?.setAttribute('hidden', '');
            return;
        }
        elemento.textContent = valor;
        tarjeta?.removeAttribute('hidden');
    });
}

function renderizarUsuarios(usuarios, administradorId = null) {
    const ordenados = [...usuarios].sort((a, b) => {
        if (ordenUsuarios === 'reciente' || ordenUsuarios === 'antiguo') {
            const fechaA = new Date(a.fecha_registro || a.created_at || 0).getTime();
            const fechaB = new Date(b.fecha_registro || b.created_at || 0).getTime();
            return ordenUsuarios === 'reciente' ? fechaB - fechaA : fechaA - fechaB;
        }
        const nombreA = [a.nombre, a.apellido].filter(Boolean).join(' ') || 'Sin nombre';
        const nombreB = [b.nombre, b.apellido].filter(Boolean).join(' ') || 'Sin nombre';
        const comparacion = nombreA.localeCompare(nombreB, 'es', { sensitivity: 'base' });
        return ordenUsuarios === 'nombre-desc' ? -comparacion : comparacion;
    });
    return ordenados.length ? ordenados.map(usuario => {
        const nombre = [usuario.nombre, usuario.apellido].filter(Boolean).join(' ') || 'Sin nombre';
        const esAdmin = usuario.es_admin === true || usuario.is_admin === true || usuario.id === administradorId;
        const accion = esAdmin ? '<span class="usuario-protegido">Administrador protegido</span>' : `<button type="button" class="btn-eliminar" data-usuario-id="${escapar(usuario.id)}">Eliminar</button>`;
        return `<tr><td>${escapar(nombre)}</td><td><span class="${esAdmin ? 'badge-admin' : 'badge-activo'}">${esAdmin ? 'Administrador' : 'Estudiante'}</span></td><td><a href="modificar-usuario.html?id=${encodeURIComponent(usuario.id)}">Ver perfil</a> ${accion}</td></tr>`;
    }).join('') : '<tr><td colspan="3">No se encontraron usuarios.</td></tr>';
}

function renderizarReportes(resumen) {
    const contenedor = document.querySelector('#vista-reportes .grid-reportes');
    if (!contenedor) return;
    const indicadores = [
        ['Progreso promedio', ['averageProgress', 'average_progress', 'progresoPromedio', 'progreso_promedio'], 'Promedio de tareas registradas'],
        ['Horas de estudio', ['totalStudyHours', 'total_study_hours', 'horasEstudio', 'horas_estudio'], 'Acumuladas por los usuarios'],
        ['Tareas completadas', ['completedTasks', 'completed_tasks', 'tareasCompletadas', 'tareas_completadas'], 'Datos de actividad real'],
        ['Planes generados', ['totalPlans', 'total_plans', 'planes_estudio', 'planesEstudio', 'planesGenerados'], 'Planes registrados en la plataforma'],
    ];
    contenedor.innerHTML = indicadores.map(([titulo, claves, detalle]) => {
        const valor = claves.map(clave => resumen?.[clave]).find(dato => dato !== undefined && dato !== null);
        return valor === undefined || valor === null || valor === '' ? '' : `<div class="tarjeta-reporte reporte-real"><span>${titulo}</span><strong>${escapar(valor)}</strong><small>${detalle}</small></div>`;
    }).join('');
    if (!contenedor.innerHTML) contenedor.innerHTML = '<p class="estado-reportes">No hay estadísticas disponibles.</p>';
}

async function cargarDatosAdmin(usuarioId, sesionEsAdmin = false) {
    const [resumenResultado, usuariosResultado, adminsResultado] = await Promise.allSettled([
        obtenerResumenAdmin(usuarioId),
        obtenerUsuariosAdmin(usuarioId),
        obtenerTotalAdministradores(),
    ]);
    if (resumenResultado.status === 'fulfilled') {
        const respuesta = resumenResultado.value;
        const resumen = respuesta?.overview || respuesta?.resumen || respuesta?.data || respuesta || {};
        renderizarReportes(resumen);
        mostrarValor(['metricas-total-usuarios'], resumen, ['totalUsers', 'total_users', 'totalUsersCount', 'totalUsuarios', 'usuariosTotales']);
        mostrarValor(['metricas-total-admins'], resumen, ['totalAdmins', 'total_admins', 'adminsCount', 'administradoresTotales']);
    } else {
        renderizarReportes({});
    }

    const usuarios = usuariosResultado.status === 'fulfilled' ? extraerUsuarios(usuariosResultado.value) : [];
    usuariosActuales = usuarios;
    const administradoresEnLista = usuarios.filter(usuario => usuario.es_admin === true || usuario.is_admin === true || usuario.id === usuarioId).length;
    const totalAdministradores = adminsResultado.status === 'fulfilled'
        ? Math.max(adminsResultado.value, sesionEsAdmin ? 1 : 0)
        : Math.max(administradoresEnLista, sesionEsAdmin ? 1 : 0);
    mostrarValor(['metricas-total-admins'], { totalAdmins: totalAdministradores }, ['totalAdmins']);

    if (usuariosResultado.status === 'rejected') {
        throw usuariosResultado.reason;
    }

    const tabla = document.getElementById('tabla-body-estudiantes');
    tabla.innerHTML = renderizarUsuarios(usuarios, usuarioId);
}

async function cargarNombreAdmin(usuario) {
    let datos = usuario;
    const nombreInicial = usuario.user_metadata?.full_name || usuario.email?.split('@')[0] || 'usuario';
    document.getElementById('saludo-admin').textContent = `Bienvenido otra vez, ${nombreInicial}`;
    try {
        const respuesta = await obtenerUsuarioConPerfil(usuario.id);
        const envoltura = respuesta?.data || respuesta || {};
        datos = { ...usuario, ...(envoltura.usuario || envoltura.user || envoltura) };
    } catch (error) {
        console.warn('No se pudo cargar el nombre del administrador:', error.message);
    }
    const nombre = [datos.nombre, datos.apellido].filter(Boolean).join(' ') || datos.user_metadata?.full_name || datos.email?.split('@')[0] || 'usuario';
    document.getElementById('saludo-admin').textContent = `Bienvenido otra vez, ${nombre}`;
}

document.addEventListener('DOMContentLoaded', async () => {
    document.getElementById('btn-nav-usuarios')?.remove();
    document.getElementById('btn-nav-config')?.remove();
    try {
        const usuario = await obtenerUsuarioActual();
        const comprobacionAdmin = usuario?.id ? await comprobarAdmin(usuario.id) : null;
        if (!usuario?.id || !comprobacionAdmin?.admin) {
            window.location.href = './historial.html';
            return;
        }
        const fecha = new Intl.DateTimeFormat('es-CO', { dateStyle: 'long' }).format(new Date());
        document.querySelectorAll('.fecha-hoy').forEach(elemento => { elemento.textContent = fecha; });
        cargarNombreAdmin(usuario);
        try {
            await cargarDatosAdmin(usuario.id, Boolean(comprobacionAdmin.admin));
        } catch (error) {
            document.getElementById('tabla-body-estudiantes').innerHTML = `<tr><td colspan="3">${escapar(error.message)}</td></tr>`;
        }
        document.getElementById('input-buscar')?.addEventListener('input', async event => {
            try {
                const respuesta = await obtenerUsuariosAdmin(usuario.id, event.target.value.trim());
                const usuarios = extraerUsuarios(respuesta);
                usuariosActuales = usuarios;
                const tabla = document.getElementById('tabla-body-estudiantes');
                tabla.innerHTML = renderizarUsuarios(usuarios, usuario.id);
            } catch (error) {
                document.getElementById('tabla-body-estudiantes').innerHTML = `<tr><td colspan="3">${escapar(error.message)}</td></tr>`;
            }
        });
        document.getElementById('orden-usuarios')?.addEventListener('change', event => {
            ordenUsuarios = event.target.value;
            document.getElementById('tabla-body-estudiantes').innerHTML = renderizarUsuarios(usuariosActuales, usuario.id);
        });
        document.getElementById('tabla-body-estudiantes')?.addEventListener('click', async event => {
            const boton = event.target.closest('[data-usuario-id]');
            if (!boton || !confirm('¿Eliminar este usuario? Esta acción no se puede deshacer.')) return;
            boton.disabled = true;
            try {
                await eliminarUsuarioAdmin(usuario.id, boton.dataset.usuarioId);
                await cargarDatosAdmin(usuario.id, Boolean(comprobacionAdmin.admin));
            } catch (error) {
                alert(error.message);
                boton.disabled = false;
            }
        });
    } catch (error) {
        console.warn('No se pudo validar el acceso de administrador:', error.message);
        window.location.href = './login.html';
        return;
    }

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
        });
    }

    // 4. Lógica de Cerrar Sesión
    if (btnLogout) {
        btnLogout.addEventListener('click', () => {
            const confirmar = confirm('¿Estás seguro de que deseas cerrar sesión?');
            if (confirmar) {
                localStorage.removeItem('userEmail');
                localStorage.removeItem('userRole');
                sessionStorage.clear();
                // Redirige al login
                window.location.href = 'login.html';
            }
        });
    }

});