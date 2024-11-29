import express from 'express';
import cors from 'cors';
import axios from 'axios'; // Импортируйте axios вместо request

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
