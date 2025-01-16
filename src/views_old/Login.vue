vue
<!--2024.12.23 это не используеимый код из первой версии, адаптированный под vue3-->
<template>
  <v-container fluid fill-height>
    <v-row align="center" justify="center">
      <v-col cols="12" sm="8" md="6">
        <v-card class="elevation-12">
          <v-toolbar dark color="primary">
            <v-toolbar-title>Login form</v-toolbar-title>
          </v-toolbar>
          <v-card-text>
            <v-form ref="form" v-model="valid">
              <v-text-field
                  prepend-icon="mdi-account"
                  name="email"
                  label="Email"
                  type="email"
                  v-model="email"
                  :rules="emailRules"
                  @keyup.enter="onSubmit"
              ></v-text-field>
              <v-text-field
                  prepend-icon="mdi-lock"
                  name="password"
                  label="Password"
                  type="password"
                  :counter="6"
                  v-model="password"
                  :rules="passwordRules"
                  @keyup.enter="onSubmit"
              ></v-text-field>
            </v-form>
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn
                color="primary"
                @click="onSubmit"
                :loading="loading"
                :disabled="!valid || loading"
            >Login</v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import { ref, computed, onMounted } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';

const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;

export default {
  setup() {
    const store = useStore();
    const router = useRouter();

    const email = ref('');
    const password = ref('');
    const valid = ref(false);

    const emailRules = [
      v => !!v || 'E-mail is required',
      v => emailRegex.test(v) || 'E-mail must be valid'
    ];

    const passwordRules = [
      v => !!v || 'Password is required',
      v => (v && v.length >= 6) || 'Password must be equal or more than 6 characters'
    ];

    const loading = computed(() => store.getters.loading);

    const onSubmit = () => {
      if (valid.value) {
        const user = {
          email: email.value,
          password: password.value
        };
        store.dispatch('loginUser', user)
            .then(() => {
              router.push('/');
            })
            .catch(() => {});
      }
    };

    onMounted(() => {
      if (router.currentRoute.value.query['loginError']) {
        store.dispatch('setError', 'Please log in to access this page.');
      }
    });

    return {
      email,
      password,
      valid,
      emailRules,
      passwordRules,
      loading,
      onSubmit
    };
  }
};
</script>