import { supabase } from '../config/supabase.js';

/**
 * Guarda una franja de horario libre en la base de datos
 */
export async function guardarHorarioBD({ usuario_id, dia, hora_inicio, hora_fin }) {
  try {
    const { data, error } = await supabase
      .from('horarios')
      .insert([
        {
          usuario_id,
          dia,
          hora_inicio,
          hora_fin
        }
      ])
      .select();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error guardando el horario en Supabase:', error);
    throw error;
  }
}

/**
 * Obtiene los horarios configurados por el usuario
 */
export async function obtenerHorariosUsuarioBD(usuario_id) {
  try {
    const { data, error } = await supabase
      .from('horarios')
      .select('*')
      .eq('usuario_id', usuario_id);

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error al consultar horarios:', error);
    return [];
  }
}