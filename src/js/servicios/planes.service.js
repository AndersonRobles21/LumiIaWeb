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

export async function marcarPlanCompletadoBD(planId) {
  const { data, error } = await supabase
    .from('planes_estudio')
    .update({ estado: 'COMPLETADO' })
    .eq('id', planId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function reabrirPlanBD(planId) {
  const { data, error } = await supabase
    .from('planes_estudio')
    .update({ estado: 'ACTIVO' })
    .eq('id', planId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function eliminarPlanEstudioBD(planId) {
  const { data: actividades, error: errorActividades } = await supabase
    .from('actividades')
    .select('id')
    .eq('plan_id', planId);
  if (errorActividades) throw errorActividades;

  const actividadIds = (actividades || []).map(actividad => actividad.id);
  if (actividadIds.length) {
    const { error: errorTareas } = await supabase.from('tareas').delete().in('actividad_id', actividadIds);
    if (errorTareas) throw errorTareas;
    const { error: errorActividadesDelete } = await supabase.from('actividades').delete().in('id', actividadIds);
    if (errorActividadesDelete) throw errorActividadesDelete;
  }

  const { error } = await supabase.from('planes_estudio').delete().eq('id', planId);
  if (error) throw error;
}

export async function eliminarPlanPorActividadBD(actividadId) {
  const { data: actividad, error } = await supabase
    .from('actividades')
    .select('plan_id')
    .eq('id', actividadId)
    .single();
  if (error) throw error;
  if (actividad?.plan_id) {
    await eliminarPlanEstudioBD(actividad.plan_id);
    return actividad.plan_id;
  }
  return null;
}