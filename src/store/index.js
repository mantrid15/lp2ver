import { createStore } from 'vuex';

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
