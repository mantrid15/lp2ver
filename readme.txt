20250529
npx vite --port 3000
иногда не работает npm run dev и приходится использовать npx vite --port 3000
Если процесс не останавливается
Найти процесс Vite вручную (если он "завис"):

Windows (PowerShell):

powershell
netstat -ano | findstr :3000  # Найти PID процесса на порту 3000
taskkill /PID <PID> /F        # Убить процесс (подставьте найденный PID)


20250312
Уязвимости:
 Это требует внимания, и рекомендуется использовать команду
 npm audit fix
 для автоматического исправления некоторых из них.

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

свободен ли 3000 порт
в терминале

$port = 3000
$tcpConnection = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue

if (-not $tcpConnection) {
    Write-Host "Порт $port свободен."
} else {
    Write-Host "Порт $port занят."
}