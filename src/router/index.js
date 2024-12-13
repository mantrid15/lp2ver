import { createRouter, createWebHistory } from 'vue-router';
import HomeView from '@/views/HomeView.vue';
// import MainTool from '@/views/MainTool.vue';
// import { supabase } from '@/clients/supabase';
// import LoginView from "@/views_old/LoginView.vue";

// let localUser;

// const routes = [
// 	{
// 		path: '/',
// 		name: 'home',
// 		component: HomeView
// 	},
// 		{
// 		path: '/about',
// 		name: 'about',
// 		component: Auth
// 	},
// // 	{
// // 		path: '/auth',
// // 		name: 'auth',
// // 		component: Auth
// // 	},
// // 	{
// // 		path: '/secret',
// // 		name: 'secret',
// // 		component: LinkInputRow,
// // 		meta: { requiresAuth: true }
// // 	},
// // 	{
// // 		path: '/login',
// // 		name: 'login',
// // 		component: LoginView
// // 	},
// // 	{
// // 		path: '/unauthorized',
// // 		name: 'unauthorized',
// // 		component: UnauthorizedView
// // 	}
// ];
//
const router = createRouter({
	history: createWebHistory(import.meta.env.BASE_URL),
	routes: [
		{
			path: "/",
			name: "home",
			component: HomeView,
		},
		{
			path: "/login",
			name: "login",
			component: () => import("../views/LoginView.vue"),
		},
		{
			path: "/about",
			name: "about",
			// route level code-splitting
			// this generates a separate chunk (About.[hash].js) for this route
			// which is lazy-loaded when the route is visited.
			component: () => import("../views/MainTool.vue"),
		},
	],
});

export default router;
//
// async function getUser(next) {
// 	localUser = await supabase.auth.getSession();
// 	if (localUser.data.session == null) {
// 		next('/unauthorized');
// 	} else {
// 		next();
// 	}
// }
//
// router.beforeEach((to, from, next) => {
// 	if (to.meta.requiresAuth) {
// 		getUser(next);
// 	} else {
// 		next();
// 	}
// });


