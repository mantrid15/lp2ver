20241128
из-за
Чтобы запустить Google Chrome с отключенной проверкой CORS через PowerShell,
вы можете использовать следующую команду:

Копировать
Start-Process "chrome.exe" -ArgumentList '--user-data-dir="C:\Chrome dev session"', '--disable-web-security'

для обновления коммитов на github сначала git commit -v
для получения информации о коммитах
после
git fetch origin
потом
git reset --hard origin/main



Чтобы обновить коммиты на GitHub, вы можете использовать команду `git commit --amend` для изменения последнего коммита или `git rebase -i` для интерактивного перебазирования и изменения нескольких коммитов. Вот примеры