const CLAVE_TEMA = 'lumi_tema';
const TEMA_OSCURO = 'dark';
const TEMA_CLARO = 'light';

export function aplicarTema(tema) {
  const temaValido = tema === TEMA_CLARO ? TEMA_CLARO : TEMA_OSCURO;
  document.documentElement.dataset.theme = temaValido;
  localStorage.setItem(CLAVE_TEMA, temaValido);
  document.querySelectorAll('[data-tema]').forEach(control => {
    control.classList.toggle('activo', control.dataset.tema === temaValido);
    control.setAttribute('aria-pressed', String(control.dataset.tema === temaValido));
  });
}

export function inicializarTema() {
  const temaGuardado = localStorage.getItem(CLAVE_TEMA);
  aplicarTema(temaGuardado || TEMA_OSCURO);
  document.querySelectorAll('[data-tema]').forEach(control => {
    control.addEventListener('click', () => aplicarTema(control.dataset.tema));
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', inicializarTema);
} else {
  inicializarTema();
}
