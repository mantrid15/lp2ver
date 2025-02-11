import express from 'express';
import cors from 'cors';
import axios from 'axios'; // Импортируйте axios вместо request
import puppeteer from 'puppeteer';

const app = express();

// Используйте CORS для разрешения всех источников
app.use(cors());

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



// Функция для извлечения метаданных
async function puppeteerMetaData(url) {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    try {
        console.log(`Открываем страницу: ${url}`);
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
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

// Новый маршрут для извлечения метаданных с помощью Puppeteer
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

// Ваши маршруты и другая логика сервера
app.get('/metaDataService', (req, res) => {
    // Ваша логика обработки запроса
    res.json({ message: 'Данные успешно получены!' });
});

// Запуск сервера
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Сервер запущен на порту ${PORT}`);
});
