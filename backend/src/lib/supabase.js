/**
 * Ce fichier fournit une exportation simplifiée du client Supabase 
 * en utilisant la configuration de /config/supabase.js
 */

const { supabase, supabaseAdmin, executeSupabaseQuery } = require('../config/supabase');

module.exports = {
  supabase,
  supabaseAdmin,
  executeSupabaseQuery
}; 