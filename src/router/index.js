import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'
import LoginView from '@/views/LoginView.vue'
import UnauthorizedView from '@/views/UnauthorizedView.vue'
import LinkInputRow from "@/views/LinkInputRow.vue";
import { supabase } from '@/clients/supabase'

let localUser;

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView
    },
	  // {
		//   path: '/linkparser',
		//   name: 'linkparser',
		//   component: LinkInputRow
	  // },
    {
      path: '/secret',
      name: 'secret',
      component: () => import('../views/LinkInputRow.vue'),
	  meta: { requiresAuth: true }
    },
	{
      path: '/login',
	  name: 'login',
	  component: LoginView
	},
	{
	  path: '/unauthorized',
	  name: 'unauthorized',
	  component: UnauthorizedView
	}
  ]
})

async function getUser(next) {
	localUser = await supabase.auth.getSession();
	if (localUser.data.session == null) {
		next('/unauthorized')
	}
	else {
		next();
	}
}


router.beforeEach((to, from, next) => {
	if (to.meta.requiresAuth) {
		// console.log('requires Auth')
		getUser(next);
	}
	else {
		next();
	}
})

export default router
