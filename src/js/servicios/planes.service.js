import { supabase } from '../config/supabase.js';

/**
 * Guarda una nueva tarea / plan de estudio en Supabase
 */
export async function crearPlanEstudioBD({ usuario_id, titulo, descripcion, fecha_entrega, estado = 'ACTIVO' }) {
  try {
    // 1. Insertar en la tabla 'planes_estudio'
    const { data: plan, error: errorPlan } = await supabase
      .from('planes_estudio')
      .insert([
        {
          usuario_id,
          nombre: titulo,
          descripcion,
          estado
        }
      ])
      .select()
      .single();

    if (errorPlan) throw errorPlan;

    // 2. Insertar la actividad asociada (fecha limite)
    const { data: actividad, error: errorActividad } = await supabase
      .from('actividades')
      .insert([
        {
          plan_id: plan.id,
          titulo,
          descripcion,
          fecha: fecha_entrega,
          estado: 'PENDIENTE'
        }
      ])
      .select()
      .single();

    if (errorActividad) throw errorActividad;

    return { plan, actividad };
  } catch (error) {
    console.error('Error guardando el plan en Supabase:', error);
    throw error;
  }
}

/**
 * Obtiene todos los planes de estudio del usuario actual
 */
export async function obtenerPlanesUsuarioBD(usuario_id) {
  try {
    const { data, error } = await supabase
      .from('planes_estudio')
      .select(`
        *,
        actividades (*)
      `)
      .eq('usuario_id', usuario_id)
      .order('fecha_creacion', { ascending: false });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error al obtener planes:', error);
    return [];
  }
}

export async function actualizarMetodoPlanBD(planId, metodo_estudio) {
  const { data, error } = await supabase
    .from('planes_estudio')
    .update({ metodo_estudio })
    .eq('id', planId)
    .select()
    .single();
  if (error) throw error;
  return data;
}