import express from 'express';
import cors from 'cors';
import axios from 'axios';
import puppeteer from 'puppeteer';
import { WebSocketServer } from 'ws';
import dotenv from "dotenv"; // Импортируем только WebSocketServer

dotenv.config({ path: '.env.local' });
const HF_TOKEN = process.env.VUE_APP_HF_TOKEN_AI;
// console.log('HF_TOKEN:', HF_TOKEN); // Проверка токена
const app = express();
app.use(cors({
    origin: '*', // Или укажите конкретный домен
}));
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

// Эндпоинт для генерации тегов
app.post('/generate-tags', async (req, res) => {

    const { title, description, keywords } = req.body;
    console.log("Получен запрос на /generate-tags:", req.body);
    // const repoId = "Qwen/Qwen2.5-Coder-32B-Instruct";
    const repoId = "mistralai/Mistral-7B-Instruct-v0.3";
    const teg = `${title} ${description} ${keywords}`.trim();
    const tegPrompt = `Identify three tags that you would use to characterize the following row if you were to assign
  a clear classification that defined the area or domain of knowledge for that row. Avoid using general terms that do not
  characterize the content. If the row does not provide enough information, you can gradually reduce the number of tags
  returned to one. Also avoid using verbs, participles, or adjectives. Recommended tags should include terms, names,
  or titles. No reasoning or intermediate data is needed. Return only comma-separated strings."${teg}"`;

    try {
        const response = await axios.post(
            `https://api-inference.huggingface.co/models/${repoId}`,
            {
                inputs: tegPrompt,
                parameters: { max_new_tokens: 200 },
                task: "text-generation",
            },
            {
                headers: {
                    Authorization: `Bearer ${HF_TOKEN}`,
                },
            }
        );

        let generatedText = response.data[0].generated_text;
        generatedText = generatedText.replace(tegPrompt, '').trim();
        res.json({ tags: generatedText });
    } catch (error) {
        console.error("Error calling the LLM:", error.response ? error.response.data : error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

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

// Функция для отправки URL всем подключенным клиентам
const broadcastUrl = (data) => {
    console.log('Broadcasting data to clients:', data);
    clients.forEach((client) => {
        if (client.readyState === 1) {
            if (clientLastData.has(client)) {
                const previousData = clientLastData.get(client);
                client.send(JSON.stringify({ remove: previousData.url }));
            }
            clientLastData.set(client, data);
            client.send(JSON.stringify(data));
        }
    });
};