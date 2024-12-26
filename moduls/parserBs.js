
import axios from 'axios';
import * as cheerio from 'cheerio';

async function fetchMetaData(url) {
    try {
        const { data } = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });
        // const title = $('title').text();

        const $ = cheerio.load(data);
        const description = $('meta[name="description"]').attr('content') || '';
        const keywords = $('meta[name="keywords"]').attr('content') || '';

        return {

            description,
            keywords
        };
    } catch (error) {
        console.error('Ошибка при получении мета-данных:', error.response ? error.response.data : error.message);
        return null;
    }
}

// Пример использования
const url = 'https://www.discogs.com/release/2069490-Manit%C3%BA-Hirilorn-Letanias';
fetchMetaData(url).then(metaData => {
    console.log(metaData);
});