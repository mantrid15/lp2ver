// вытягивает описание из ссылки

// import translate from 'translate-google';
// import axios from '../../libraries_exo/axios.min.js';
import axios from 'axios';
import translateText from "./text_processor.js";
// import * as cheerio from '../../libraries_exo/cheerio.min.js';
import * as cheerio from 'cheerio';

// const mainUrl= 'https://www.youtube.com/watch?v=fTU7wgUyE_o&ab_channel=%D0%A0%D0%A6%D0%98%D0%9C%D0%A4%D0%9A%D0%98%D0%A1%D0%A0%D0%B5%D0%B0%D0%B1%D0%B8%D0%BB%D0%B8%D1%82%D0%B0%D1%86%D0%B8%D0%BE%D0%BD%D0%BD%D1%8B%D0%B9%D1%86%D0%B5%D0%BD%D1%82%D1%80'
// const mainUrl= 'https://github.com/vuetifyjs/vuetify'
const mainUrl= 'https://habr.com/ru/articles/575050/'
// const mainUrl= 'https://github.com/FranckFreiburger/vue3-sfc-loader/discussions/34'
// const mainUrl= 'https://github.com/FranckFreiburger/vue3-sfc-loader/issues/14#issuecomment-758794153'
// const mainUrl= 'https://www.deep-ml.com/'

//

async function getPageInfo(url) {
    try {
        const response = await axios.get(url);
        const $ = cheerio.load(response.data);

        const pageInfo = {
            url,
            title: $('title').text(),
            description: $('meta[name="description"]').attr('content') || '',
            keywords: $('meta[name="keywords"]').attr('content') || ''
        };
        pageInfo.descriptionRu = await translateText(pageInfo.description);
        if (pageInfo.descriptionRu === pageInfo.description) {
            pageInfo.descriptionRu = '';
        }

        // console.log(typeof(pageInfo))

        // alert(pageInfo);
        return pageInfo;
    } catch (error) {
        console.error('Ошибка при получении информации о странице:', error);
        return { error: 'Ошибка при получении информации' };
    }
}

export default getPageInfo

// Пример использованияgetPageInf
getPageInfo(mainUrl)
    .then(info => console.log(info));

const getPageInfoTwo = async (url) => {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const html = await response.text();

        // Создаем временный элемент для парсинга HTML
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        const info = {
            url,
            title: doc.title,
            description: doc.querySelector('meta[name="description"]') ?
                doc.querySelector('meta[name="description"]').content : '',
            keywords: doc.querySelector('meta[name="keywords"]') ?
                doc.querySelector('meta[name="keywords"]').content : ''
        };

        return info;
    } catch (error) {
        console.error('Ошибка при получении информации о странице:', error);
        return { error: 'Ошибка при получении информации' };
    }
};

// Пример использования
// getPageInfoTwo(mainUrl).then(info => {
//     console.log('Информация о странице:', info); // Выводим информацию в консоль
//     alert(JSON.stringify(info, null, 2)); // Выводим информацию в виде алерта
// });