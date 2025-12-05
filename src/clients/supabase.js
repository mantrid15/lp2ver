import { createClient } from "@supabase/supabase-js";
// console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL)
// console.log('Supabase Key:', import.meta.env.VITE_SUPABASE_KEY ? 'есть' : 'нет')
//
// if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_KEY) {
//     console.error('Supabase переменные не загружены!')
// }

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);
// console.log(supabaseUrl, supabaseKey)