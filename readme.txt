pm2 delete all
NODE_ENV=production pm2 start server.js --name "linkparser-backend"
pm2 start "npx vite --mode production --host 0.0.0.0 --port 5173" --name "linkparser-frontend"

20251205 - набор команд для запуска сервера / PROD
# Удаляем все процессы
pm2 delete all
# Проверяем что ничего не осталось
pm2 status
#cd ~/WebstormProjects/lp2ver
# Только бэкенд
pm2 start server.js --name "linkparser-backend"
# Только фронтенд
pm2 start "npx vite --host 0.0.0.0 --port 5173" --name "linkparser-frontend"
pm2 status
# Должно быть ИЛИ:
# - 2 процесса (backend + frontend)
# - ИЛИ 1 процесс (linkparser-app)
sudo netstat -tulpn | grep -E '(:3002|:5173)'



Вариант 2: Через npm run dev (оба вместе)
bash
cd ~/WebstormProjects/lp2ver

# Один процесс запускает оба (бэкенд + фронтенд)
pm2 start npm --name "linkparser-app" -- run dev








20250529
npx vite --port 3002
иногда не работает npm run dev и приходится использовать npx vite --port 3002
Если процесс не останавливается
Найти процесс Vite вручную (если он "завис"):

Windows (PowerShell):

powershell
netstat -ano | findstr :3002  # Найти PID процесса на порту 3002
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
git reset --hard origin/master



Чтобы обновить коммиты на GitHub, вы можете использовать команду `git commit --amend` для изменения последнего коммита или `git rebase -i` для интерактивного перебазирования и изменения нескольких коммитов. Вот примеры

свободен ли 3002 порт
в терминале

$port = 3002
$tcpConnection = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue

if (-not $tcpConnection) {
    Write-Host "Порт $port свободен."
} else {
    Write-Host "Порт $port занят."
}