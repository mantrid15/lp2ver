// components/store/index.js
import { createStore } from 'vuex';
import { supabase } from '@/clients/supabase'


const store = createStore({
    state: {
        userId: null,
        session: null, // Сохраняем данные текущей сессии
    },
    mutations: {
        // Устанавливает идентификатор пользователя
        setUserId(state, userId) {
            state.userId = userId;
        },
        // Устанавливает данные сессии
        setSession(state, session) {
            state.session = session;
        },
        // Очищает сессию
        clearSession(state) {
            state.userId = null;
            state.session = null;
        },
    },
    actions: {
        async login({ commit }, credentials) {
            const { data, error } = await supabase.auth.signInWithPassword(credentials);
            if (error) throw error; // Пробрасываем ошибку
            const session = data.session;
            if (session) {
                localStorage.setItem('supabaseSession', JSON.stringify(session));
                commit('setUserId', session.user.id);
                commit('setSession', session);
            }
            return { data, error };
        },
        async createAccount({ commit }, credentials) {
            const { data, error } = await supabase.auth.signUp(credentials);
            if (error) throw error; // Пробрасываем ошибку
            return { data, error };
        },
        async logout({ commit }) {
            const { error } = await supabase.auth.signOut();
            if (error) throw error; // Пробрасываем ошибку
            commit('clearSession');
            localStorage.removeItem('supabaseSession');
        },
        // Восстанавливает сессию из localStorage
        restoreSession({ commit }) {
            const storedSession = localStorage.getItem('supabaseSession');
            if (storedSession) {
                const parsedSession = JSON.parse(storedSession);

                // Устанавливаем данные сессии и userId
                commit('setSession', parsedSession);
                commit('setUserId', parsedSession?.user?.id || null);
            }
        },
        // Очищает сессию
        clearSession({ commit }) {
            commit('clearSession');
            localStorage.removeItem('supabaseSession');
        },
    },
    getters: {
        // Проверяет, авторизован ли пользователь
        isAuthenticated(state) {
            return !!state.userId;
        },
        // Получает данные текущей сессии
        getSession(state) {
            return state.session;
        },
    },
});

export default store;
