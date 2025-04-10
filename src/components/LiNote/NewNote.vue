
<template>
  <div>
    <h2>Создание заметки</h2>
    <textarea v-model="noteContent" placeholder="Вставьте текст с картинками..." rows="10" cols="50"></textarea>
    <button @click="processClipboardContent">Сохранить заметку</button>

    <h2>Просмотр заметок</h2>
    <div v-html="renderedMarkdown"></div>
  </div>
</template>

<script>
import { supabase } from '@/clients/supabase.js';
import { ref, computed } from 'vue';

export default {
  name: "NewNote",
  setup() {
    const noteContent = ref('');
    const images = ref([]);

    const processClipboardContent = async () => {
      const items = await navigator.clipboard.read();
      for (const item of items) {
        for (const file of item.types) {
          if (file.startsWith('image/')) {
            const blob = await item.getType(file);
            const imageUrl = await uploadImage(blob);
            images.value.push(imageUrl);
          }
        }
      }

      // Заменяем ссылки на изображения в тексте
      let contentWithImages = noteContent.value;
      images.value.forEach((url) => {
        contentWithImages = contentWithImages.replace(/<img[^>]+src="([^">]+)"/g, `![Image](${url})`);
      });

      // Сохранение заметки в формате Markdown
      await saveNoteToDatabase(contentWithImages);
    };

    const uploadImage = async (file) => {
      const { data, error } = await supabase.storage.from('linknote').upload(`public/${file.name}`, file);
      if (error) throw new Error(error.message);
      return `${supabaseUrl}/storage/v1/object/public/linknote/${data.Key}`; // Возвращает URL загруженного изображения
    };

    const saveNoteToDatabase = async (content) => {
      const { data, error } = await supabase.from('notes').insert([{ content }]);
      if (error) throw new Error(error.message);
      noteContent.value = ''; // Очистка поля после сохранения
      images.value = []; // Очистка массива изображений
    };

    const renderedMarkdown = computed(() => {
      // Используйте библиотеку для рендеринга Markdown, например, marked.js
      return marked(noteContent.value);
    });

    return {
      noteContent,
      processClipboardContent,
      renderedMarkdown,
    };
  },
};
</script>

<style scoped>

</style>