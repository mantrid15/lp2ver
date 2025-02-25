console.log("Фоновый скрипт активирован.");

chrome.action.onClicked.addListener(() => {
  console.log("Иконка расширения нажата.");

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (!tabs || tabs.length === 0) {
      console.error("Активная вкладка не найдена.");
      return;
    }

    const tab = tabs[0];
    const url = tab.url;
    console.log("URL активной вкладки:", url);

    // Показываем уведомление об активации расширения
    chrome.tabs.sendMessage(tab.id, {
      action: "showPopup",
      status: "info",
      text: "Расширение активировано на данной странице"
    });

    // Запрашиваем у content script метаданные (title, description, keywords, tag)
    chrome.tabs.sendMessage(tab.id, { action: "getMeta" }, (response) => {
      // Инициализируем объект метаданных с пустыми значениями
      let meta = {
        title: "",
        description: "",
        keywords: "",
        tag: ""
      };

      if (chrome.runtime.lastError) {
        console.error("Ошибка запроса метаданных:", chrome.runtime.lastError);
      } else if (response) {
        meta.title = response.title || "";
        meta.description = response.description || "";
        meta.keywords = response.keywords || "";
        meta.tag = response.tag || "";
        console.log("Получены метаданные:");
        console.log("Title:", meta.title);
        console.log("Description:", meta.description);
        console.log("Keywords:", meta.keywords);
        console.log("Tag:", meta.tag);
      } else {
        console.error("Метаданные не получены.");
      }

      // Формирование объекта data с URL и метаданными
      const data = {
        url: url,
        title: meta.title,
        description: meta.description,
        keywords: meta.keywords,
        tag: meta.tag
      };

      console.log("Отправляем URL и метаданные на сервер...");

      // Отправка данных на сервер
      fetch("http://localhost:3000/api/send-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      })
          .then((response) => {
            console.log("Получен ответ от сервера.");
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
  });
});