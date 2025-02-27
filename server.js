import express from 'express';
import cors from 'cors';
import axios from 'axios';
import puppeteer from 'puppeteer';
import { WebSocketServer } from 'ws'; // Импортируем только WebSocketServer

const app = express();
app.use(cors());
app.use(express.json());

// Создаем HTTP-сервер
const server = app.listen(3000, () => {
    console.log('Сервер запущен на порту 3000');
});

// Создаем WebSocket-сервер
const wss = new WebSocketServer({ server });

// Хранилище для WebSocket-клиентов и их последних отправленных данных
const clients = new Set();
const clientLastData = new Map();

wss.on('connection', (ws) => {
    console.log('Новое подключение WebSocket');
    clients.add(ws);

    ws.on('close', () => {
        console.log('WebSocket соединение закрыто');
        clients.delete(ws);
        clientLastData.delete(ws);
    });

    ws.on('error', (error) => {
        console.error('Ошибка WebSocket:', error);
    });
});

// Функция для отправки URL всем подключенным клиентам.
// Если у клиента уже есть предыдущая ссылка, сначала отправляем команду удаления.
const broadcastUrl = (data) => {
    console.log('Broadcasting data to clients:', data); // Логирование перед отправкой данных

    clients.forEach((client) => {
        // Проверяем, что соединение открыто (числовое значение 1 соответствует OPEN)
        if (client.readyState === 1) {
            if (clientLastData.has(client)) {
                const previousData = clientLastData.get(client);
                // Отправляем клиенту команду удаления старых данных
                client.send(JSON.stringify({ remove: previousData.url }));
            }
            // Сохраняем новые данные для клиента
            clientLastData.set(client, data);
            // Отправляем новые данные
            client.send(JSON.stringify(data));
        }
    });
};

// Маршрут для приема URL от расширения Chrome
app.post('/api/send-url', async (req, res) => {
    // Принимаем весь словарь (объект) из тела запроса
    const data = req.body;
    // Проверяем, что в словаре есть ключ `url`
    if (!data || !data.url) {
        return res.status(400).json({ error: 'URL не предоставлен' });
    }
    // console.log('Received data from extension:', data);
    // Отправляем данные всем подключенным клиентам через WebSocket
    broadcastUrl(data);
    // Возвращаем ответ с полученными данными
    res.json({ status: 'Data received', data });
});

// Остальные маршруты (прокси, Puppeteer и т.д.)
app.get('/proxy', async (req, res) => {
    const url = req.query.url;
    if (!url) {
        return res.status(400).json({ error: 'URL не указан' });
    }
    try {
        const response = await axios.get(url);
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