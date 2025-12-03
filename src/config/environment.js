// Определение окружения
export const isProduction = import.meta.env.PROD || process.env.NODE_ENV === 'production';
export const isDevelopment = !isProduction;

// Базовые URL
export const getApiUrl = () => {
    if (isProduction) {
        return import.meta.env.VITE_API_URL || 'http://192.168.0.40:3002';
    }
    return import.meta.env.VITE_API_URL || 'http://localhost:3002';
};

export const getWsUrl = () => {
    if (isProduction) {
        return import.meta.env.WS_URL || 'ws://192.168.0.40:3002';
    }
    return import.meta.env.WS_URL || 'ws://localhost:3002';
};

// Supabase конфиг
export const getSupabaseConfig = () => ({
    url: import.meta.env.VITE_SUPABASE_URL,
    key: import.meta.env.VITE_SUPABASE_KEY,
});