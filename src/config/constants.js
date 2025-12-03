// src/config/constants.js
export const SERVER_CONFIG = {
    HOST: import.meta.env.VITE_SERVER_HOST || 'localhost',
    PORT: import.meta.env.VITE_SERVER_PORT || 3002,
    API_URL: import.meta.env.VITE_API_URL || 'http://localhost:3002',
    WS_URL: import.meta.env.VITE_WS_URL || 'ws://localhost:3002',
    IS_PRODUCTION: import.meta.env.PROD || false,
};

// Утилиты для построения URL
export const getApiUrl = (endpoint = '') =>
    `${SERVER_CONFIG.API_URL}${endpoint}`;

export const getWsUrl = () => SERVER_CONFIG.WS_URL;