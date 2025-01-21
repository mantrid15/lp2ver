import { createRouter, createWebHistory } from 'vue-router';
import HomeView from '@/views/HomeView.vue';
import { supabase } from '@/clients/supabase'
import LoginVue from '../views/LoginView.vue'
import UnauthorizedView from '../views/UnauthorizedView.vue'
import LoginView from "@/views/LoginView.vue";
import Info from '@/views/InfoView.vue';
import LinzerView from '@/views/LinzerView.vue';
import { useStore } from 'vuex';


const router = createRouter({
	history: createWebHistory(import.meta.env.BASE_URL),
	routes: [
		{
			path: "/",
			name: "home",
			component: HomeView,
		},
		{
			path: "/linzer",
			name: "linzer",
			component: LinzerView,
			meta: { requiresAuth: true }
		},
		{
			path: "/login",
			name: "login",
			component: LoginView,
		},
		{
			path: "/inforeg",
			name: "inforeg",
			component: Info,
		},
		{
			path: '/unauthorized',
			name: 'unauthorized',
			component: UnauthorizedView
		}
	],
});


//


async function getUser(next) {
	const localUser = await supabase.auth.getSession();
	if (localUser.data.session == null) {
		next('/unauthorized');
	} else {
		next();
	}
}

router.beforeEach((to, from, next) => {
	if (to.meta.requiresAuth) {
		// console.log('requires Auth')
		getUser(next);
	} else {
		next();
	}
});

export default router;