console.log("Фоновый скрипт активирован.");

chrome.action.onClicked.addListener((tab) => {
  console.log("Иконка расширения нажата.");

  // Шаг 1: Извлечение метатегов, тегов <link> и атрибута lang из <html>
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: () => {
      // Функция для извлечения метатегов, тегов <link> и атрибута lang из <html>
      const metaTags = document.querySelectorAll('head meta[property], head link[rel]');
      const htmlLang = document.documentElement.getAttribute('lang') || ""; // Получаем атрибут lang из <html>
      const result = {};

      metaTags.forEach((tag) => {
        if (tag.tagName === 'META') {
          // Обработка метатегов
          const property = tag.getAttribute('property') || "";
          const content = tag.getAttribute('content') || "";

          if (property.toLowerCase().includes('title')) {
            result['title'] = content;
          } else if (property.toLowerCase().includes('description')) {
            result['description'] = content;
          } else if (property.toLowerCase().includes('keywords')) {
            result['keywords'] = content;
          } else if (property.toLowerCase().includes('tag')) {
            result['tag'] = content;
          } else if (property.toLowerCase().includes('url')) {
            result['url'] = content;
          }
        } else if (tag.tagName === 'LINK') {
          // Обработка тегов <link>
          const rel = tag.getAttribute('rel') || "";
          const href = tag.getAttribute('href') || "";

          if (rel.toLowerCase().includes('icon')) {
            result['favicon'] = href;
          } else if (rel.toLowerCase().includes('alternate') && tag.getAttribute('type') === 'application/rss+xml') {
            result['rss'] = href;
          }
        }
      });

      // Добавляем атрибут lang в результат
      result['lang'] = htmlLang;

      // Обработка keywords и tag
      if (result['keywords'] && result['tag']) {
        result['keywords'] = `${result['keywords']}, ${result['tag']}`;
      } else if (result['keywords']) {
        result['keywords'] = result['keywords'];
      } else if (result['tag']) {
        result['keywords'] = result['tag'];
      } else if (!result['keywords']) {
        result['keywords'] = "";
      }

      // Удаляем временный ключ tag, так как он больше не нужен
      delete result['tag'];

      return result;
    }
  }, (results) => {
    if (chrome.runtime.lastError) {
      console.error("Ошибка выполнения скрипта:", chrome.runtime.lastError);
      return;
    }

    // Выводим результат в консоль
    const metaData = results[0].result;
    console.log("Метаданные из тегов <head> и lang из <html>:", metaData);

    // Шаг 2: Нормализация данных
    const normalizedData = {
      title: metaData['title'] || "",
      description: metaData['description'] || "",
      keywords: metaData['keywords'] || "", // Уже обработано выше
      rss: metaData['rss'] || "",
      favicon: metaData['favicon'] || "",
      url: metaData['url'] || tab.url, // Если url пустой, берем из активной вкладки
      lang: metaData['lang'] || "" // Добавляем lang
    };

    console.log("Нормализованные данные:", normalizedData);

    // Шаг 3: Продолжаем выполнение оригинального кода
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (!tabs || tabs.length === 0) {
        console.error("Активная вкладка не найдена.");
        return;
      }

      const tab = tabs[0];
      console.log("Активная вкладка:", tab);
      console.log("URL активной вкладки:", tab.url);
      console.log("Заголовок активной вкладки:", tab.title);

      // Показываем уведомление об активации расширения
      chrome.tabs.sendMessage(tab.id, {
        action: "showPopup",
        status: "info",
        text: "Расширение активировано на данной странице"
      });

      // Задержка перед запросом метаданных, чтобы content.js успел загрузиться
      setTimeout(() => {
        // Запрашиваем у content script метаданные (title, description, keywords, tag)
        chrome.tabs.sendMessage(tab.id, { action: "getMeta" }, (response) => {
          if (chrome.runtime.lastError) {
            console.error("Ошибка запроса метаданных:", chrome.runtime.lastError);
            return;
          }

          // Инициализируем объект метаданных с пустыми значениями
          let meta = {
            title: response?.title || "",
            description: response?.description || "",
            keywords: response?.keywords || response?.tag || "", // Объединяем keywords и tag
            tag: "" // Очищаем tag, так как он объединен с keywords
          };

          console.log(meta);
          console.log("Получены метаданные:");
          console.log("Title:", meta.title);
          console.log("Description:", meta.description);
          console.log("Keywords:", meta.keywords);

          // Формирование объекта data с URL и метаданными
          const data = {
            url: tab.url, // Используем URL активной вкладки:
            title: meta.title || normalizedData['title'], // Используем meta.title, если он не пустой, иначе берем из normalizedData
            description: meta.description || normalizedData['description'], // Аналогично для description
            keywords: meta.keywords || normalizedData['keywords'], // Аналогично для keywords
            favicon: normalizedData['favicon'], // Используем нормализованный favicon
            rss: normalizedData['rss'], // Используем нормализованный RSS
            lang: normalizedData['lang'] // Используем нормализованный lang
          };

          // Дополнительная проверка на длину данных
          if (meta.title && normalizedData['title'] && meta.title.length < normalizedData['title'].length) {
            data.title = normalizedData['title'];
          }

          if (meta.description && normalizedData['description'] && meta.description.length < normalizedData['description'].length) {
            data.description = normalizedData['description'];
          }

          if (meta.keywords && normalizedData['keywords'] && meta.keywords.length < normalizedData['keywords'].length) {
            data.keywords = normalizedData['keywords'];
          }

          console.log("Отправляем URL и метаданные на сервер...");
          console.log(data);

          // Отправка данных на сервер
          fetch("http://localhost:3000/api/send-url", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url: data.url })
          })
              .then((response) => {
                if (!response.ok) {
                  throw new Error("Ошибка сети");
                }
                return response.json();
              })
              .then((serverData) => {
                console.log("Успешно отправлено на сервер, данные:", serverData);
                // Уведомление об успешной отправке данных
                chrome.tabs.sendMessage(tab.id, {
                  action: "showPopup",
                  status: "success",
                  text: "Данные отправлены"
                });
              })
              .catch((error) => {
                console.error("Ошибка при отправке данных на сервер:", error);
                chrome.tabs.sendMessage(tab.id, {
                  action: "showPopup",
                  status: "error",
                  text: "Ошибка отправки"
                });
              });
        });
      }, 1000); // Задержка в 1 секунду
    });
  });
});