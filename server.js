import express from 'express';
import cors from 'cors';

const app = express();

// Используйте CORS для разрешения всех источников
app.use(cors());

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