/**
 * validaciones.js
 * Validadores reutilizables para formularios
 */

export function esHoraValida(hora) {
  return /^([01]\d|2[0-3]):([0-5]\d)$/.test(hora);
}

export function esTextoValido(texto, min = 1) {
  return typeof texto === 'string' && texto.trim().length >= min;
}