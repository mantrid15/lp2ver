20241128
из-за
Чтобы запустить Google Chrome с отключенной проверкой CORS через PowerShell,
вы можете использовать следующую команду:

Копировать
Start-Process "chrome.exe" -ArgumentList '--user-data-dir="C:\Chrome dev session"', '--disable-web-security'