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

    // Отправляем сообщение в content script для отображения уведомления об активации расширения
    chrome.tabs.sendMessage(tab.id, {
      action: "showPopup",
      status: "info",
      text: "Расширение активировано на данной странице"
    });

    // Запрашиваем у content script метаданные открытой страницы (title, description, keywords, tag)
    chrome.tabs.sendMessage(tab.id, { action: "getMeta" }, (response) => {
      if (chrome.runtime.lastError) {
        console.error("Ошибка запроса метаданных:", chrome.runtime.lastError);
        return;
      }
      if (response) {
        console.log("Title:", response.title);
        console.log("Description:", response.description);
        console.log("Keywords:", response.keywords);
        console.log("Tag:", response.tag);
      } else {
        console.error("Метаданные не получены.");
      }
    });

    // Отправка URL на сервер
    console.log("Отправляем URL на сервер...");
    fetch("http://localhost:3000/api/send-url", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: url }),
    })
      .then((response) => {
        console.log("Получен ответ от сервера.");
        return response.json();
      })
      .then((data) => {
        console.log("Успешно отправлено на сервер, данные:", data);
        // Уведомление об успешной отправке URL
        chrome.tabs.sendMessage(tab.id, {
          action: "showPopup",
          status: "success",
          text: "Ссылка отправлена",
        });
      })
      .catch((error) => {
        console.error("Ошибка при отправке URL на сервер:", error);
        // Отправляем сообщение в content script для отображения всплывающего окна (ошибка)
        chrome.tabs.sendMessage(tab.id, {
          action: "showPopup",
          status: "error",
          text: "Ошибка отправки",
        });
      });
  });
});