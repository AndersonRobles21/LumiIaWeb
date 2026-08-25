/**
 * fechas.js
 * Funciones reutilizables para manejo de fechas y días de la semana
 */

export function construirFechaISO(anio, mes, dia) {
  return `${anio}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
}

export function normalizarFecha(fecha) {
  if (!fecha) return '';
  if (typeof fecha === 'string') return fecha.substring(0, 10);
  const f = new Date(fecha);
  if (Number.isNaN(f.getTime())) return '';
  return construirFechaISO(f.getFullYear(), f.getMonth() + 1, f.getDate());
}

/**
 * Retorna el índice de día ajustado a Lunes (0) ... Domingo (6)
 */
export function obtenerIndiceDiaSemana(anio, mes, dia) {
  const fecha = new Date(anio, mes - 1, dia);
  const diaSemana = fecha.getDay(); // 0 = Domingo, 1 = Lunes
  return diaSemana === 0 ? 6 : diaSemana - 1;
}

export const DIAS_SEMANA = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];