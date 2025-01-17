import { createStore } from 'vuex';

const store = createStore({
    state: {
        userId: null,
    },
    mutations: {
        setUserId(state, userId) {
            state.userId = userId;
        },
    },
});

export default store;