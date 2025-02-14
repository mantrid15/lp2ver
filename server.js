import express from 'express';
import cors from 'cors';
import axios from 'axios'; // Импортируйте axios вместо request
// import puppeteer from 'puppeteer-extra';
import puppeteer from 'puppeteer';
import { WebSocketServer } from 'ws'; // Импортируем WebSocketServer

const app = express();

// Используйте CORS для разрешения всех источников
app.use(cors());
app.use(express.json());

// Создаем HTTP-сервер
const server = app.listen(3000, () => {
  console.log('Сервер запущен на порту 3000');
});

// Создаем WebSocket-сервер
const wss = new WebSocketServer({ server });

// Хранилище для WebSocket-клиентов
const clients = new Set();

wss.on('connection', (ws) => {
  console.log('Новое подключение WebSocket');
  clients.add(ws);

    ws.on('close', () => {
        console.log('WebSocket соединение закрыто');
        clients.delete(ws);
    });

    ws.on('error', (error) => {
        console.error('Ошибка WebSocket:', error);
    });
});

// Функция для отправки URL всем подключенным клиентам
const broadcastUrl = (url) => {
  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({ url }));
    }
  });
};

// Маршрут для приема URL от расширения Chrome
app.post('/api/send-url', async (req, res) => {
    const { url } = req.body;
    if (!url) {
        return res.status(400).json({ error: 'URL не предоставлен' });
    }

  console.log('Received URL from extension:', url);
  // Отправляем URL всем подключенным клиентам через WebSocket
  broadcastUrl(url);
  res.json({ status: 'URL received', url });
});

// Остальные маршруты (прокси, Puppeteer и т.д.)
app.get('/proxy', async (req, res) => {
    const url = req.query.url;
    if (!url) {
        return res.status(400).json({ error: 'URL не указан' });
    }

    try {
        const response = await axios.get(url); // Используйте axios для выполнения запроса
        res.set('Content-Type', response.headers['content-type']);
        res.send(response.data);
    } catch (error) {
        return res.status(500).json({ error: 'Ошибка при запросе к URL' });
    }
});

// Маршрут для извлечения метаданных с помощью Puppeteer
app.get('/fetch-metadata', async (req, res) => {
  const url = req.query.url;
  if (!url) {
    return res.status(400).json({ error: 'URL не предоставлен' });
  }

  const metaData = await puppeteerMetaData(url);
  if (metaData) {
    res.json(metaData);
  } else {
    res.status(500).json({ error: 'Ошибка при получении мета-данных' });
  }
});

async function puppeteerMetaData(url) {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    try {
        console.log(`Открываем страницу: ${url}`);
        await page.goto(url, { waitUntil: 'networkidle2' });
// Ожидание 10 секунд
//         await delay(5000); // Ожидание 10 секунд
        console.log('Страница загружена. Извлекаем мета-данные...');

        // Извлекаем заголовок и мета-данные
        const metaData = await page.evaluate(() => {
            const headTitle = document.querySelector('html head title')?.textContent || '';
            const documentTitle = document.querySelector('title')?.textContent || '';
            const title = headTitle || documentTitle || '';
            const description = document.querySelector('meta[name="description"]')?.content || '';
            const keywords = document.querySelector('meta[name="keywords"]')?.content || '';

            return { title, description, keywords };
        });

        console.log('Мета-данные извлечены:', metaData);
        return metaData;
    } catch (error) {
        console.error('Ошибка при получении мета-данных:', error.message);
        return null;
    } finally {
        await browser.close();
    }
}
