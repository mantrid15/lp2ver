import express from 'express';
import cors from 'cors';
import axios from 'axios';
import puppeteer from 'puppeteer';
import { WebSocketServer } from 'ws';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Загружаем переменные окружения
dotenv.config({ path: '.env.local' });
const HF_TOKEN = process.env.VUE_APP_HF_TOKEN_AI;

// Инициализация Express
const app = express();
app.use(cors({ origin: '*' })); // Разрешаем запросы с любого домена
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

// Эндпоинт для загрузки фавиконов
app.post('/upload-favicon', async (req, res) => {
    const { faviconUrl, faviconName } = req.body;

    if (!faviconUrl || !faviconName) {
        return res.status(400).json({ error: 'URL фавикона или имя не указаны' });
    }

    try {
        // Получаем изображение по URL
        const response = await axios.get(faviconUrl, { responseType: 'arraybuffer' });
        const blob = response.data;

        // Сохраняем файл локально
        const filePath = path.join(__dirname, 'storage_fav', faviconName); // Путь к локальной папке
        fs.writeFileSync(filePath, blob);
        console.log('Файл успешно сохранен локально:', filePath);

        // Загружаем файл в Supabase Storage
        const file = new File([blob], faviconName, { type: 'image/png' }); // Укажите правильный MIME-тип
        const { data, error: storageError } = await supabase
            .storage
            .from('favibucket')
            .upload(faviconName, file, {
                contentType: 'image/png', // Динамически определяем MIME-тип
                upsert: true,
            });

        if (storageError) {
            console.error('Ошибка при загрузке файла в Supabase:', storageError);
            return res.status(500).json({ error: 'Ошибка при загрузке файла в Supabase' });
        }

        console.log('Файл успешно загружен в Supabase Storage:', faviconName);
        res.json({ status: 'Фавикон успешно загружен', filePath });
    } catch (error) {
        console.error('Ошибка при загрузке фавикона:', error);
        res.status(500).json({ error: 'Ошибка при загрузке фавикона' });
    }
});















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

// НЕРАБОЧИЭндпоинт для загрузки изображений через прокси
app.get('/proxy-image', async (req, res) => {
  const imageUrl = req.query.url;
  console.log(imageUrl, 'Получен запрос на /proxy-image');

  if (!imageUrl) {
    return res.status(400).json({ error: 'URL изображения не указан' });
  }

  try {
    const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
    res.set('Content-Type', response.headers['content-type']);
    res.send(response.data);
    console.log('Изображение успешно загружено', imageUrl);
  } catch (error) {
    console.error('Ошибка при загрузке изображения:', error);
    res.status(500).json({ error: 'Ошибка при загрузке изображения' });
  }
});

// Эндпоинт для генерации тегов
app.post('/generate-tags', async (req, res) => {
    const { title, description, keywords } = req.body;
    console.log('Получен запрос на /generate-tags:', req.body);

    const repoId = 'Qwen/Qwen2.5-Coder-32B-Instruct';
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
                task: 'text-generation',
            },
            {
                headers: {
                    Authorization: `Bearer ${HF_TOKEN}`,
                },
            }
        );

        let generatedText = response.data[0].generated_text;
        generatedText = generatedText.replace(tegPrompt, '').trim();
        generatedText = generatedText.replace(/["\\]/g, '').trim();

        const tagsArray = generatedText.split(',').map((tag) => tag.trim()).filter((tag) => tag !== '');

        res.json({ tags: tagsArray });
        console.log(tagsArray);
    } catch (error) {
        console.error('Error calling the LLM:', error.response ? error.response.data : error.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Маршрут для приема URL от расширения Chrome
app.post('/api/send-url', async (req, res) => {
    const data = req.body;

    if (!data || !data.url) {
        return res.status(400).json({ error: 'URL не предоставлен' });
    }

    broadcastUrl(data);
    res.json({ status: 'Data received', data });
});

// Маршрут для прокси-запросов
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
        res.status(500).json({ error: 'Ошибка при запросе к URL' });
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

app.get('/proxy-favicon', async (req, res) => {
    const faviconUrl = req.query.url;

    if (!faviconUrl) {
        return res.status(400).json({ error: 'URL изображения не указан' });
    }

    try {
        const response = await axios.get(faviconUrl, { responseType: 'arraybuffer' });
        console.log('Изображение успешно загружено', faviconUrl);

        // Устанавливаем заголовки для кэширования на 1 год
        res.set('Cache-Control', 'public, max-age=31536000');
        res.set('Expires', new Date(Date.now() + 31536000000).toUTCString());
        res.set('Content-Type', response.headers['content-type']);
        res.send(response.data);
        console.log('Изображение успешно загружено и закэшировано', faviconUrl);
    } catch (error) {
        console.error('Ошибка при загрузке изображения:', error);
        res.status(500).json({ error: 'Ошибка при загрузке изображения' });
    }
});

// Функция для извлечения метаданных с помощью Puppeteer
async function puppeteerMetaData(url) {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    try {
        console.log(`Открываем страницу: ${url}`);
        await page.goto(url, { waitUntil: 'networkidle2' });
        console.log('Страница загружена. Извлекаем мета-данные...');

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

// Функция для отправки данных всем подключенным клиентам WebSocket
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