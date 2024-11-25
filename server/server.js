// server.js
const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const translate = require('translate-google');

const app = express();
const PORT = process.env.PORT || 5173;

app.get('/api/getPageInfo', async (req, res) => {
    const { url } = req.query;

    try {
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3'
            }
        });
        const $ = cheerio.load(response.data);
        const title = $('title').text();
        const description = $('meta[name="description"]').attr('content') || '';
        const keywords = $('meta[name="keywords"]').attr('content') || '';
        const descriptionRu = await translate(description, { to: 'ru' });

        res.json({
            url,
            title,
            description,
            descriptionRu,
            keywords
        });
    } catch (error) {
        console.error('Ошибка при получении информации о странице:', error);
        res.status(500).json({ error: 'Ошибка при получении информации' });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
