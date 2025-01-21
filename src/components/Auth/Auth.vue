<template>
  <v-sheet class="bg-deep-purple pa-12" rounded>
      <v-card class="mx-auto px-6 py-8" max-width="344">
        <h1 class="text-center">Auth&Login</h1>
        <v-form v-model="form" @submit.prevent="onSubmit">
          <v-text-field
              v-model="email"
              :rules="[required]"
              class="mb-2"
              label="Email"
              clearable
              autocomplete="username"
              @keyup.enter="focusPassword"
              :placeholder="'Enter your email'"
          ></v-text-field>
          <v-text-field
              :append-inner-icon="visible ? 'mdi-eye-off' : 'mdi-eye'"
              :type="visible ? 'text' : 'password'"
              v-model="password"
              :rules="[required]"
              label="Password"
              placeholder="Enter your password"
              clearable
              ref="passwordField"
              @keyup.enter="onSubmit"
              @click:append-inner="visible = !visible"
              autocomplete="current-password"
          ></v-text-field>
          <div class="buttonContainer">
            <v-btn :loading="loading" @click="isLogin ? login() : createAccount()" color="blue" block>
              {{ isLogin ? 'Войти' : 'Создать' }}
            </v-btn>
            <v-btn @click="toggleForm" color="green" block>
              {{ isLogin ? 'Создать аккаунт' : 'Уже есть аккаунт?' }}
            </v-btn>
            <v-btn @click="logout" color="red" block>Выйти</v-btn>
          </div>
        </v-form>

        <!-- Всплывающее окно для ошибок -->
        <v-dialog v-model="dialog" max-width="290">
          <v-card>
            <v-card-title class="headline">Ошибка</v-card-title>
            <v-card-text>{{ errorMessage }}</v-card-text>
            <v-card-actions>
              <v-btn color="primary" @click="dialog = false">ОК</v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>
      </v-card>
  </v-sheet>
</template>

<script>
import { ref, onMounted, computed } from "vue";
import { useRouter } from "vue-router";
import { supabase } from "@/clients/supabase";
import {useStore} from "vuex";

export default {
  name: "Auth",
  setup(_, { emit }) {
    const userId = ref('');
    const store = useStore();
    const email = ref("");
    const password = ref("");
    // const lastSuccessfulEmail = ref("");
    const form = ref(false);
    const loading = ref(false);
    const router = useRouter();
    const isLogin = ref(true);
    const dialog = ref(false);
    const errorMessage = ref("");
    const visible = ref(false); // Добавлено для управления видимостью пароля
    const required = (value) => !!value || 'Обязательное поле';

    // Загрузка последнего успешного email при инициализации
    onMounted(() => {
      const storedEmail = localStorage.getItem('lastSuccessfulEmail');
      if (storedEmail) {
        // Автоматически подставляем последний email при загрузке
        email.value = storedEmail;
      }
    });

    // Функция для перехода к полю пароля
    function focusPassword() {
      passwordField.value.focus(); // Установка фокуса на поле пароля
    }

    async function createAccount() {
      console.log("Создание аккаунта начато...");
      const { data, error } = await supabase.auth.signUp({
        email: email.value,
        password: password.value,
      });
      if (error) {
        showError(`Ошибка создания аккаунта: ${error.message} (Код: ${error.code})`);
      } else {
        // Сохраняем email при успешной регистрации
        localStorage.setItem('lastSuccessfulEmail', email.value);
        console.log("Аккаунт создан:", data);
        router.push('/inforeg');
      }
    }

    async function login() {
      console.log("Вход в систему начат...");
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.value,
        password: password.value,
      });
      if (error) {
        showError(`Ошибка входа: ${error.message} (Код: ${error.code})`);
      } else {
        console.log("Вход выполнен:", data);
        const session = data.session;
        if (session) {
          // Сохраняем сессию в localStorage
          localStorage.setItem('supabaseSession', JSON.stringify(session));

          // Сохраняем сессию в Vuex
          store.commit('setSession', session);
          store.commit('setUserId', session.user.id);
        }

        emit('login-state-change', true);
        router.push('/linzer');
      }
    }

    async function logout() {
      console.log("Выход из системы начат...");
      const {error} = await supabase.auth.signOut();
      if (error) {
        showError(`Ошибка выхода: ${error.message} (Код: ${error.code})`);
      } else {
        console.log("Выход выполнен успешно");
        emit('login-state-change', false); // Emit logout state change
        // emit('changeButtonColor', 'red');
        console.log('login-state-change')

        // Очищаем Vuex и localStorage
        await store.dispatch('clearSession');
        emit('login-state-change', false);
        // router.push('/');
        await router.push('/');
        // Получаем последний успешный email
        const lastEmail = localStorage.getItem('lastSuccessfulEmail') || '';

        // Очищаем пароль и подставляем последний email
        password.value = '';
        email.value = lastEmail;
      }
    }

    function toggleForm() {
      isLogin.value = !isLogin.value;
    }

    function onSubmit() {
      loading.value = true;
      console.log(isLogin.value ? "Обработка входа..." : "Обработка создания аккаунта...");
      if (isLogin.value) {
        login().finally(() => (loading.value = false));
      } else {
        createAccount().finally(() => (loading.value = false));
      }
    }

    function showError(message) {
      errorMessage.value = message;
      dialog.value = true; // Открыть всплывающее окно
    }

    return {
      userId,
      email,
      password,
      form,
      loading,
      createAccount,
      login,
      logout,
      required,
      toggleForm,
      onSubmit,
      isLogin,
      dialog,
      errorMessage,
      focusPassword,
      visible, // Возвращаем переменную visible
    };
  },
};
</script>

<style scoped>
.buttonContainer {
  display: flex;
  flex-direction: column;
}
.red-button {
  background-color: red;
  color: white;
}
.purple-button {
  background-color: purple;
}
</style>
