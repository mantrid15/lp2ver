import { createClient } from "@supabase/supabase-js";

// Отладочное логирование
console.log('=== Supabase Configuration Debug ===');
console.log('VITE_SUPABASE_URL from import.meta.env:', import.meta.env.VITE_SUPABASE_URL ? 'есть' : 'нет');
console.log('VITE_SUPABASE_KEY from import.meta.env:', import.meta.env.VITE_SUPABASE_KEY ? 'есть' : 'нет');
console.log('APP_CONFIG from window:', window.APP_CONFIG ? 'есть' : 'нет');

// Получаем переменные с fallback на window.APP_CONFIG
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ||
    (window.APP_CONFIG && window.APP_CONFIG.VITE_SUPABASE_URL) ||
    'https://wfofanoqnvqnxtmpkpqz.supabase.co';

const supabaseKey = import.meta.env.VITE_SUPABASE_KEY ||
    (window.APP_CONFIG && window.APP_CONFIG.VITE_SUPABASE_KEY) ||
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indmb2Zhbm9xbnZxbnh0bXBrcHF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzUxMjk2ODYsImV4cCI6MjA1MDcwNTY4Nn0.12OmfiUuo0fMxt7QOzBcTO9tm4afW8L1IPsaJ_zoKxo';

console.log('Final supabaseUrl:', supabaseUrl ? supabaseUrl.substring(0, 30) + '...' : 'нет');
console.log('Final supabaseKey:', supabaseKey ? 'есть (скрыт)' : 'нет');

// Проверка конфигурации
if (!supabaseUrl || !supabaseKey) {
    const error = new Error('Supabase configuration is missing');
    console.error('❌', error.message);
    console.error('supabaseUrl:', supabaseUrl);
    console.error('supabaseKey:', supabaseKey ? 'есть' : 'нет');
    throw error;
}

// Создаем клиент
console.log('✅ Создаем Supabase клиент...');
const supabase = createClient(supabaseUrl, supabaseKey);

// Проверяем подключение (асинхронно)
setTimeout(async () => {
    try {
        // Используем системную таблицу которая всегда существует
        const { data, error } = await supabase.auth.getSession();

        if (error) {
            console.warn('⚠️ Supabase подключен, но тестовый запрос не удался:', error.message);
        } else {
            console.log('✅ Supabase успешно подключен');
        }
    } catch (err) {
        console.warn('⚠️ Не удалось проверить подключение Supabase:', err.message);
    }
}, 1000);

export { supabase };