const formularioRegistro = document.getElementById("formulario-registro");

const contrasena = document.getElementById("contrasena");
const confirmarContrasena = document.getElementById(
    "confirmar-contrasena"
);

formularioRegistro.addEventListener("submit", (evento) => {
    evento.preventDefault();

    if (contrasena.value !== confirmarContrasena.value) {
        alert("Las contraseñas no coinciden");
        return;
    }

    console.log("Formulario de registro enviado");

    // Más adelante:
    //
    // registro.js
    //      ↓
    // autenticacion.service.js
    //      ↓
    // Supabase Auth
    //      ↓
    // modificar-usuario.html
});
