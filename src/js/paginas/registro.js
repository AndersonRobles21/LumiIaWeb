import { registrarUsuario } from '../servicios/autenticacion.service.js';

const formularioRegistro = document.getElementById("formulario-registro");

const contrasena = document.getElementById("contrasena");
const confirmarContrasena = document.getElementById(
    "confirmar-contrasena"
);

formularioRegistro?.addEventListener("submit", async (evento) => {
    evento.preventDefault();

    if (contrasena.value !== confirmarContrasena.value) {
        alert("Las contraseñas no coinciden");
        return;
    }

    const nombre = document.getElementById('nombre').value.trim();
    const correo = document.getElementById('correo').value.trim();

    try {
        const apellido = document.getElementById('apellido')?.value.trim() || null;
        await registrarUsuario(correo, contrasena.value, { nombre, apellido });
        window.location.href = 'login.html';
    } catch (error) {
        alert(`No se pudo crear la cuenta: ${error.message}`);
    }
});
