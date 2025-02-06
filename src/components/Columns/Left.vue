<template>
  <div class="column column-1" :style="{ backgroundColor: 'green', width: width }">
    <div v-if="userId && account?.data?.session?.user?.email" class="user-info">
      Account: {{ account.data.session.user.email }}
    </div>
  </div>
</template><script>
import {computed, onMounted, ref} from 'vue';
import { useStore } from 'vuex';
import {supabase} from "@/clients/supabase.js";

export default {
  name: 'Left',

  props: {
    width: {
      type: String,
      required: true
    }
  },

  setup() {
    const store = useStore();
    const userId = computed(() => store.state.userId);
    const userEmail = computed(() => store.state.user.email);
    const account = ref();
    async function getSession() {
      account.value = await supabase.auth.getSession();
      console.log(account.value);
    }
    onMounted(() => {
      getSession(); // Вызываем при монтировании компонента
    });

    return {
      userId,
      userEmail,
      account, // Возвращаем account, чтобы он был доступен в шаблоне
    };
  }
};
</script>



<style scoped>
.column {
  flex-shrink: 0;
  overflow: hidden;
  height: 100%;
}
</style>