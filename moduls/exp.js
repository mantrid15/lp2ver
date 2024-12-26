// вытягивает описание из ссылки

import axios from 'axios';
import * as cheerio from 'cheerio';
// import translateToRussian from text_processor.js
import translateText from './text_processor.js';
async function getPageDescription(url) {
    try {
        // Получаем HTML-контент страницы
        const response = await axios.get(url);

        // Загружаем HTML в cheerio
        const $ = cheerio.load(response.data);

        // Ищем мета-тег с описанием
        const descriptionMetaTag = $('meta[name="description"]');

        // Если мета-тег найден, возвращаем его содержимое
        if (descriptionMetaTag.length > 0) {
            return descriptionMetaTag.attr('content');
        } else {
            return 'Описание не найдено';
        }
    } catch (error) {
        console.error('Ошибка при получении описания страницы:', error);
        return 'Ошибка при получении описания';
    }
}

const mainUrl= 'https://www.discogs.com/release/2069490-Manit%C3%BA-Hirilorn-Letanias'
// const mainUrl= 'https://soft-file.ru/perestal-rabotat-goodbye-dpi-chto-delat/'
// const mainUrl= 'https://1.downfiles.ru/999414-artem-shumeyko-kurs-po-backend-razrabotke-na-fastapi-2023-pcrec.html'
// getPageDescription('https://www.youtube.com/watch?v=L36FgWGwlxU&ab_channel=NunyaKlah')
//     .then(description => console.log(description));

// async function getPageInfo(url) {
//     try {
//         // Получаем HTML-контент страницы
//         const response = await axios.get(url);
//
//         // Загружаем HTML в cheerio
//         const $ = cheerio.load(response.data);
//
//         // Получаем заголовок страницы
//         const title = $('title').text();
//
//         // Получаем все мета-теги
//         const metaTags = $('meta');
//         const metaTagsList = [];
//
//         // Сохраняем мета-теги в список
//         metaTags.each((index, element) => {
//             const metaTag = {
//                 name: $(element).attr('name') || $(element).attr('property'),
//                 content: $(element).attr('content')
//             };
//             if (metaTag.content) {
//                 metaTagsList.push(metaTag);
//             }
//         });
//
//         return {
//             title,
//             metaTags: metaTagsList
//         };
//     } catch (error) {
//         console.error('Ошибка при получении информации о странице:', error);
//         return 'Ошибка при получении информации';
//     }
// }
async function getPageInfo(url) {
    // return `Info about URL: ${url}`;
    try {
        // Получаем HTML-контент страницы
        const response = await axios.get(url);
        // Загружаем HTML в cheerio
        const $ = cheerio.load(response.data);
        // Получаем заголовок страницы
        const title = $('title').text();
        // Получаем мета-теги
        const description = $('meta[name="description"]').attr('content') || '';
        const keywords = $('meta[name="keywords"]').attr('content') || '';
        const descriptionRu = await translateText(description)

        return {
            url,
            title,
            description,
            descriptionRu,
            keywords
        };
    } catch (error) {
        console.error('Ошибка при получении информации о странице:', error);
        return 'Ошибка при получении информации';
    }
}
// export default getPageInfo

// Пример использованияgetPageInf
getPageInfo(mainUrl)
    .then(info => console.log(info));