import express from 'express';
import cors from 'cors';
import axios from 'axios';
import puppeteer from 'puppeteer';
import {WebSocketServer} from 'ws';
import dotenv from 'dotenv';
import path from 'path';
import fs from "fs";

// Определяем окружение и загружаем правильный .env файл
const isProduction = process.env.NODE_ENV === 'production';
const envFile = isProduction ? '.env.production' : '.env.development';

// Загружаем переменные окружения
dotenv.config({ path: envFile });
const HF_TOKEN = process.env.VUE_APP_HF_TOKEN_AI;

// Конфигурация сервера в зависимости от окружения
const PORT = process.env.PORT || 3002;
const HOST = isProduction ? '0.0.0.0' : 'localhost';

// Инициализация Express
const app = express();

// Настройка CORS в зависимости от окружения
const corsOptions = {
  origin: function (origin, callback) {
    // В production разрешаем все origins
    if (isProduction) {
      return callback(null, true);
    }

    // В development разрешаем только localhost
    const allowedOrigins = ['http://localhost:5173', 'http://127.0.0.1:5173'];
    if (allowedOrigins.includes(origin) || !origin) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS in development'));
    }
  },
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());
app.use((req, res, next) => {
    // ФИКС CORS: Динамически устанавливаем origin в заголовке
    const origin = req.headers.origin;
    if (origin) {
        res.header("Access-Control-Allow-Origin", origin);
    } else if (isProduction) {
        // В production разрешаем любые origins
        res.header("Access-Control-Allow-Origin", "*");
    } else {
        res.header("Access-Control-Allow-Origin", "http://localhost:5173");
    }
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

// Корневой маршрут для проверки
app.get('/', (req, res) => {
    res.json({
        status: 'online',
        service: 'LinkParser Backend',
        environment: isProduction ? 'production' : 'development',
        port: PORT,
        timestamp: new Date().toISOString()
    });
});

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'healthy' });
});

// Создаем HTTP-сервер с учетом окружения
const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`Сервер запущен на 0.0.0.0:${PORT} (принудительно)`);
});

// Создаем WebSocket-сервер
const wss = new WebSocketServer({ server });

// Хранилище для WebSocket-клиентов и их последних отправленных данных
const clients = new Set();
const clientLastData = new Map();

// Эндпоинт для загрузки фавиконов
app.post('/upload-favicon', async (req, res) => {
    const { faviconUrl, faviconName } = req.body;
    console.log('SERVER: Получаем URL фавикона:', faviconUrl);

    if (!faviconUrl || !faviconName) {
        return res.status(400).json({ error: 'SERVER: URL фавикона или имя не указаны' });
    }
    try {
        // Получаем изображение по URL
        const response = await axios.get(faviconUrl, { responseType: 'arraybuffer' });
        const blob = response.data;
        // Сохраняем файл локально
        const filePath = path.join(__dirname, 'fav', faviconName); // Путь к локальной папке
        fs.writeFileSync(filePath, blob);
        console.log('SERVER: Файл успешно сохранен локально:', filePath);
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
            console.error('SERVER: Ошибка при загрузке файла в Supabase:', storageError);
            return res.status(500).json({ error: 'SERVER: Ошибка при загрузке файла в Supabase' });
        }
        console.log('SERVER: Файл успешно загружен в Supabase Storage:', faviconName);
        res.json({ status: 'SERVER: Фавикон успешно загружен', filePath });
    } catch (error) {
        console.error('SERVER: Ошибка при загрузке фавикона:', error);
        res.status(500).json({ error: 'SERVER: Ошибка при загрузке фавикона' });
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

// Эндпоинт для загрузки изображений через прокси
app.get('/proxy-image', async (req, res) => {
    const { url } = req.query; // Изменено с imageUrl на url
    console.log(url, 'Получен запрос на /proxy-image');

    if (!url) {
        return res.status(400).json({ error: 'URL изображения не указан' });
    }

    try {
        const response = await axios.get(url, {
            responseType: 'arraybuffer',
            maxRedirects: 2
        });

        // ФИКС CORS: Динамически устанавливаем origin
        const origin = req.headers.origin;
        if (origin) {
            res.set('Access-Control-Allow-Origin', origin);
        } else if (isProduction) {
            res.set('Access-Control-Allow-Origin', '*');
        } else {
            res.set('Access-Control-Allow-Origin', 'http://localhost:5173');
        }
        res.set('Content-Type', response.headers['content-type']);
        res.send(response.data);
        console.log('Изображение успешно загружено', url);
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

        // ФИКС CORS: Динамически устанавливаем origin
        const origin = req.headers.origin;
        if (origin) {
            res.set('Access-Control-Allow-Origin', origin);
        } else if (isProduction) {
            res.set('Access-Control-Allow-Origin', '*');
        } else {
            res.set('Access-Control-Allow-Origin', 'http://localhost:5173');
        }
        res.set('Content-Type', response.headers['content-type']);
        res.send(response.data);
    } catch (error) {
        console.error('Ошибка при запросе к URL:', error);
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

// ФИКС: Прокси для внешних API чтобы избежать CORS
app.post('/proxy-serp', async (req, res) => {
    const { url } = req.body;

    if (!url) {
        return res.status(400).json({ error: 'URL не предоставлен' });
    }

    try {
        const response = await fetch('https://api.serp.tools/api/v1/tools/title-description-h1/', {
            method: 'POST',
            headers: {
                'accept-language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7,tr;q=0.6',
                'content-type': 'application/json;charset=UTF-8',
            },
            body: JSON.stringify({links: [url]}),
        });
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        const data = await response.json();

        res.json(data);
    } catch (error) {
        console.error('Ошибка при выполнении запроса: (proxy-serp)', error);
        res.status(500).json({error: 'Ошибка при получении информации (proxy-serp)'});
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

        // ФИКС CORS: Динамически устанавливаем origin
        const origin = req.headers.origin;
        if (origin) {
            res.set('Access-Control-Allow-Origin', origin);
        } else if (isProduction) {
            res.set('Access-Control-Allow-Origin', '*');
        } else {
            res.set('Access-Control-Allow-Origin', 'http://localhost:5173');
        }

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
    const browser = await puppeteer.launch({
        headless: true,
        args: isProduction ? ['--no-sandbox', '--disable-setuid-sandbox'] : []
    });
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