/**
 * supabase.js
 * Configuración de Supabase para LUMI-WEB
 * 
 * IMPORTANTE:
 * - Nunca subas las claves reales al repositorio público.
 * - Cuando tengamos las claves, las pondremos aquí o mejor usando variables de entorno.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ======================================================
// CONFIGURACIÓN (rellenar más adelante con valores reales)
// ======================================================
const SUPABASE_URL = globalThis.LUMI_CONFIG?.SUPABASE_URL || 'https://lsbnizzypdmnvppatzxp.supabase.co';
const SUPABASE_ANON_KEY = globalThis.LUMI_CONFIG?.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxzYm5penp5cGRtbnZwcGF0enhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODExOTE1MTEsImV4cCI6MjA5Njc2NzUxMX0.BSPlhX0JOwUWTYoSmzcse3MAIANgu5UniSNxm6Qjr0U';

// ======================================================
// CLIENTE DE SUPABASE
// ======================================================
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
	console.warn('Configura LUMI_CONFIG.SUPABASE_URL y LUMI_CONFIG.SUPABASE_ANON_KEY antes de usar Supabase.');
}

export const supabase = createClient(SUPABASE_URL || 'https://placeholder.supabase.co', SUPABASE_ANON_KEY || 'placeholder-anon-key');
