<script>
import { computed } from 'vue';
import { useStore } from 'vuex';

export default {
  name: 'Right',

  props: {
    width: {
      type: String,
      required: true
    }
  },

  setup() {
    const store = useStore();
    const userId = computed(() => store.state.userId);

    return {
      userId
    };
  }
};
</script>


<template>
  <div class="column column-3" :style="{ backgroundColor: 'blue', width: width }">
    <div v-if="userId" class="user-info">
      ID пользователя: {{ userId }}
    </div>
  </div>
</template>

<style scoped>
.column {
  flex-shrink: 0;
  overflow: hidden;
  height: 100%;
}

.user-info {
  padding: 1rem;
  color: white;
  font-size: 0.9rem;
}
</style>