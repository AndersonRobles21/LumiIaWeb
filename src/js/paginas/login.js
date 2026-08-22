import { iniciarSesion } from '../servicios/autenticacion.service.js';

const formularioLogin = document.getElementById("formulario-login");

formularioLogin?.addEventListener("submit", async (evento) => {
    evento.preventDefault();

    const correo = document.getElementById('correo').value.trim();
    const contrasena = document.getElementById('contrasena').value;

    try {
        const resultado = await iniciarSesion(correo, contrasena);
        if (resultado.esAdmin) {
            window.location.href = 'administrador.html';
            return;
        }
        const perfil = resultado.perfil || {};
        const perfilEstudio = perfil.perfil_estudio || perfil.perfil || perfil;
        const tienePerfil = Boolean(perfilEstudio.objetivo || (perfil.horarios || perfil.horario || []).length);
        window.location.href = tienePerfil ? 'dashboard.html' : 'perfil.html';
    } catch (error) {
        alert(`No se pudo iniciar sesión: ${error.message}`);
    }
});
