/**
 * supabase.js
 * Configuración de Supabase para LUMI-WEB
 * 
 * IMPORTANTE:
 * - Nunca subas las claves reales al repositorio público.
 * - Cuando tengamos las claves, las pondremos aquí o mejor usando variables de entorno.
 */

// import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ======================================================
// CONFIGURACIÓN (rellenar más adelante con valores reales)
// ======================================================
const SUPABASE_URL = 'TU_SUPABASE_URL_AQUI';
const SUPABASE_ANON_KEY = 'TU_SUPABASE_ANON_KEY_AQUI';

// ======================================================
// CLIENTE DE SUPABASE
// ======================================================
// Descomentar cuando tengamos las claves reales:
//
// export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
//

// Por ahora exportamos un objeto temporal para que no fallen los imports
export const supabase = {
  auth: {
    signInWithPassword: async () => ({ data: null, error: { message: 'Supabase no configurado todavía' } }),
    signUp: async () => ({ data: null, error: { message: 'Supabase no configurado todavía' } }),
    signOut: async () => ({ error: null }),
    getUser: async () => ({ data: { user: null } }),
    getSession: async () => ({ data: { session: null } }),
  },
  from: () => ({
    select: () => ({ data: null, error: { message: 'Supabase no configurado todavía' } }),
    insert: () => ({ data: null, error: { message: 'Supabase no configurado todavía' } }),
    update: () => ({ data: null, error: { message: 'Supabase no configurado todavía' } }),
    delete: () => ({ data: null, error: { message: 'Supabase no configurado todavía' } }),
  }),
};

console.log('supabase.js cargado (modo temporal - sin conexión real)');
