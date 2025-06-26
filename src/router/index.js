import { createRouter, createWebHistory } from 'vue-router';
import HomeView from '@/views/HomeView.vue';
import { supabase } from '@/clients/supabase'
import UnauthorizedView from '../views/UnauthorizedView.vue'
import LoginView from "@/views/LoginView.vue";
import Info from '@/views/InfoView.vue';
import LinzerView from '@/views/Linzer.vue';
import NoteView from '@/views/NoteView.vue';
import ToDo from '@/views/TodoView.vue';
import DGantt from '@/views/DiaGanZer.vue';
import { useStore } from 'vuex';


const router = createRouter({
	history: createWebHistory(import.meta.env.BASE_URL),
	routes: [
		{
			path: "/",
			name: "home",
			component: HomeView,
			meta: { requiresProps: true }
		},
		{
			path: "/linzer",
			name: "LinZer",
			component: LinzerView,
			meta: { requiresAuth: true }
		},
		{
			path: "/note",
			name: "LiNote",
			component: NoteView,
			meta: { requiresAuth: true }
		},

		{
			path: "/todo",
			name: "ToDo",
			component: ToDo,
			meta: { requiresAuth: true }
		},
		{
			path: "/dgantt",
			name: "DGantt",
			component: DGantt,
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