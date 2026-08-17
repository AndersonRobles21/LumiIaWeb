const progreso = document.getElementById("progreso-carga");
const textoCarga = document.getElementById("texto-carga");

let porcentaje = 0;

const intervalo = setInterval(() => {
    porcentaje += 1;

    progreso.style.width = `${porcentaje}%`;

    if (porcentaje >= 100) {
        clearInterval(intervalo);

        textoCarga.textContent = "LISTO";

        setTimeout(() => {
            window.location.href = "./src/paginas/login.html";
        }, 500);
    }
}, 25);
