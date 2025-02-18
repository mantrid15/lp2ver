console.log("Content script загружен и активен!");

// Прослушивание входящих сообщений от background.js
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "showPopup") {
    showPopupMessage(request.status, request.text);
  }
  // Можно вернуть ответ, если это необходимо
  sendResponse({ received: true });
});

// Функция для отображения всплывающего окна
function showPopupMessage(status, message) {
  // Создаём контейнер для popup, если его ещё нет
  let popup = document.getElementById("extension-popup");
  if (!popup) {
    popup = document.createElement('div');
    popup.id = 'extension-popup';
    popup.style.position = 'fixed';
    popup.style.bottom = '20px';
    popup.style.right = '20px';
    popup.style.padding = '10px 20px';
    popup.style.borderRadius = '5px';
    popup.style.boxShadow = '0 2px 6px rgba(0,0,0,0.3)';
    popup.style.zIndex = 9999;
    popup.style.fontSize = '16px';
    document.body.appendChild(popup);
  }

  // Настраиваем стили в зависимости от типа уведомления
  if (status === "success") {
    popup.style.backgroundColor = "#4caf50"; // зелёный для успеха
    popup.style.color = "#fff";
  } else if (status === "error") {
    popup.style.backgroundColor = "#f44336"; // красный для ошибки
    popup.style.color = "#fff";
  } else if (status === "info") {
    popup.style.backgroundColor = "#2196F3"; // синий для информационных сообщений
    popup.style.color = "#fff";
  } else {
    popup.style.backgroundColor = "#333";
    popup.style.color = "#fff";
  }

  // Устанавливаем текст
  popup.textContent = message;
  popup.style.display = 'block';

  // Удаляем popup через 3 секунды (или делаем fade-out)
  setTimeout(() => {
    popup.style.display = 'none';
  }, 3000);

  // Дополнительно можно генерировать CustomEvent для интеграции с Vue (если необходимо)
  const event = new CustomEvent('extensionPopup', { detail: { status, message } });
  window.dispatchEvent(event);
}

// Пример существующего кода – если он предусмотрен (например, позиционирование textarea)
textarea.style.left = "0";