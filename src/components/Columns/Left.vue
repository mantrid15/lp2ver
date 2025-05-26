<template>
  <div class="column column-1" :style="{ backgroundColor: 'green', width: width }">
    <v-container>
      <v-row>
        <v-col v-for="folder in childFolders" :key="folder.dir_hash" @click="selectFolder(folder)">
          <v-card>
            <v-card-title>{{ folder.dir_name }}</v-card-title>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script>
import { computed, ref, onMounted } from 'vue';
import { useStore } from 'vuex';
import { supabase } from "@/clients/supabase.js";

export default {
  name: 'Left',
  props: {
    width: {
      type: String,
      required: true
    },
    selectedFolderHash: {
      type: String,
      default: null
    }
  },
  setup(props) {
    const store = useStore();
    const userId = computed(() => store.state.userId);
    const folders = ref([]);

    const fetchFolders = async () => {
      const {data, error} = await supabase
          .from('dir')
          .select('*')
          .eq('user_id', userId.value);
      if (error) {
        console.error('Ошибка при получении директорий:', error);
      } else {
        folders.value = data || [];
      }
    };

    const childFolders = computed(() => {
      return folders.value.filter(folder => folder.parent_hash === props.selectedFolderHash);
    });

    const selectFolder = (folder) => {
      // Здесь можно добавить логику для выбора папки
      console.log('Выбрана папка:', folder);
    };

    onMounted(() => {
      fetchFolders(); // Вызываем при монтировании компонента
    });

    return {
      childFolders,
      selectFolder
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
