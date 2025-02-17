console.log("Фоновый скрипт активирован.");

chrome.action.onClicked.addListener(() => {
  console.log("Иконка расширения нажата.");

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (!tabs.length) {
      console.error("Активная вкладка не найдена.");
      return;
    }

    const tab = tabs[0];
    const url = tab.url;
    console.log("URL активной вкладки:", url);

    // Отправляем сообщение в content script для копирования ссылки
    chrome.tabs.sendMessage(tab.id, { action: "copyLink", url: url }, (response) => {
      console.log("Ответ от content script на копирование:", response);
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
        // Отправляем сообщение в content script для отображения всплывающего окна (успех)
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