<template>
  <div class="login-form">
    <h2>Test Form</h2>
    <form @submit.prevent="handleSubmit">
      <div>
        <label for="email">Email:</label>
        <input type="email" id="email" v-model="email" />
      </div>
      <div>
        <label for="password">Password:</label>
        <input type="password" id="password" v-model="password" />
      </div>
      <div>
        <label for="firstName">First Name:</label>
        <input type="text" id="firstName" v-model="firstName" />
      </div>
      <button type="submit" @click="createAccount">Create</button>
      <button type="submit" @click="login">Login</button>
      <button @click="seeUser">See user</button>
      <button @click="logout">Logout</button>
    </form>
  </div>
</template>

<script>
import { ref } from 'vue';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://your-supabase-url';
const supabaseAnonKey = 'your-supabase-anon-key';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default {
  setup() {
    const email = ref('');
    const password = ref('');
    const firstName = ref('');

    const createAccount = async () => {
      // Логика создания учетной записи
      try {
        const { user, error } = await supabase.auth.signUp({
          email: email.value,
          password: password.value,
          options: {
            data: {
              first_name: firstName.value,
            },
          },
        });

        if (error) throw error;
        console.log(user);
      } catch (error) {
        console.error(error);
      }
    };

    // ... аналогичные функции для login, seeUser, logout

    return {
      email,
      password,
      firstName,
      createAccount,
      // ... другие функции
    };
  },
};
</script>

<style>
/* Стили для формы */
.login-form {
  /* ... ваши стили */
}
</style>