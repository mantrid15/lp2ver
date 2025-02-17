chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "copyLink") {
    copyLink(message.url);
    sendResponse({ status: "copied" });
  } else if (message.action === "showPopup") {
    showPopup(message.text, message.status);
  }
});

function copyLink(url) {
  const textarea = document.createElement("textarea");
  textarea.style.position = "fixed";
  textarea.style.top = "0";
  textarea.style.left = "0";
  textarea.style.width = "2em";
  textarea.style.height = "2em";
  textarea.style.padding = "0";
  textarea.style.border = "none";
  textarea.style.outline = "none";
  textarea.style.boxShadow = "none";
  textarea.style.background = "transparent";
  textarea.value = url;
  document.body.appendChild(textarea);
  textarea.select();
  try {
    document.execCommand("copy");
    console.log("URL успешно скопирован в буфер обмена.");
  } catch (err) {
    console.error("Ошибка при копировании:", err);
  }
  document.body.removeChild(textarea);
}

function showPopup(text, status) {
  const popup = document.createElement("div");
  popup.textContent = text;

  popup.style.position = "fixed";
  popup.style.top = "20px";
  popup.style.left = "50%";
  popup.style.transform = "translateX(-50%)";
  popup.style.padding = "10px 20px";
  popup.style.borderRadius = "5px";
  popup.style.zIndex = "10000";
  popup.style.boxShadow = "0 2px 6px rgba(0,0,0,0.3)";
  popup.style.fontFamily = "Arial, sans-serif";

  // Определяем цвет фона в зависимости от статуса
  if (status === "error") {
    popup.style.backgroundColor = "#f44336"; // красный для ошибки
  } else {
    popup.style.backgroundColor = "#4CAF50"; // зеленый для успеха
  }
  popup.style.color = "#fff";

  document.body.appendChild(popup);

  // Убираем всплывающее окно через 2 секунды
  setTimeout(() => {
    popup.remove();
  }, 2000);
}