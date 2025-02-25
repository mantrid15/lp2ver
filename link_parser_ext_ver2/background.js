console.log("Фоновый скрипт активирован.");

chrome.action.onClicked.addListener(() => {
  console.log("Иконка расширения нажата.");

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (!tabs || tabs.length === 0) {
      console.error("Активная вкладка не найдена.");
      return;
    }
    console.log("USha!!!")
    const tab = tabs[0];
    console.log(tabs)
    const url = tab.url;
    const title = tab.title;
    console.log("Активная вкладка:", tab);
    console.log("URL активной вкладки:", url);
    console.log("title активной вкладки:", title);

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
          keywords: response?.keywords || "",
          tag: response?.tag || ""
        };

        console.log("Получены метаданные:");
        console.log("Title:", meta.title);
        console.log("Description:", meta.description);
        console.log("Keywords:", meta.keywords);
        console.log("Tag:", meta.tag);

        // Формирование объекта data с URL и метаданными
        const data = {
          url: tab.url,
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