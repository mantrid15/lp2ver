
import axios from 'axios';
import * as cheerio from 'cheerio';
/*

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
const url = 'https://lemanapro.ru/product/betonkontakt-cerezit-ct19-15-kg-13434318/';
// const url = 'https://www.discogs.com/release/2069490-Manit%C3%BA-Hirilorn-Letanias';
fetchMetaData(url).then(metaData => {
    console.log(metaData);
});*/
import puppeteer from 'puppeteer';

// async function fetchMetaData(url) {
//     // Запускаем браузер в режиме headful
//     const browser = await puppeteer.launch({ headless: true });
//     const page = await browser.newPage();
//
//     try {
//         console.log(`Открываем страницу: ${url}`);
//         await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
//         await page.goto(url, { waitUntil: 'networkidle2' });
//
//         console.log('Страница загружена. Извлекаем мета-данные...');
//         const metaData = await page.evaluate(() => {
//             // title: $('title').text(),
//             const title = document.querySelector('meta[name="title"]') ? document.querySelector('meta[name="title"]').content : '';
//             const description = document.querySelector('meta[name="description"]') ? document.querySelector('meta[name="description"]').content : '';
//             const keywords = document.querySelector('meta[name="keywords"]') ? document.querySelector('meta[name="keywords"]').content : '';
//             return {title, description, keywords };
//         });
//
//         console.log('Мета-данные извлечены:', metaData);
//         return metaData;
//     } catch (error) {
//         console.error('Ошибка при получении мета-данных:', error.message);
//         return null;
//     } finally {
//         await browser.close();
//     }
// }


// const puppeteer = require('puppeteer');

async function puppeteerMetaData(url) {
    // Запускаем браузер в режиме headful
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    try {
        console.log(`Открываем страницу: ${url}`);
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
        await page.goto(url, { waitUntil: 'networkidle2' });

        console.log('Страница загружена. Извлекаем мета-данные...');

        // Извлекаем заголовок и мета-данные
        const metaData = await page.evaluate(() => {
            // Получаем заголовок строго по пути /html/head/title
            const headTitle = document.querySelector('html head title')?.textContent || '';

            // Получаем заголовок из любого тега <title> в документе (резервный вариант)
            const documentTitle = document.querySelector('title')?.textContent || '';

            // Используем заголовок из /html/head/title, если он есть, иначе используем резервный вариант
            const title = headTitle || documentTitle || '';

            // Извлекаем другие мета-данные
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




// Пример использования
const url = 'https://dzen.ru/a/Z5quodZRjhRfvb3V?is_autologin_ya=true';
// const url = 'https://huggingface.co/deepseek-ai/DeepSeek-V3-Base';
// const url = 'https://lemanapro.ru/product/betonkontakt-cerezit-ct19-15-kg-13434318/';
puppeteerMetaData(url).then(metaData => {
    if (metaData) {
        console.log('Полученные мета-данные:', metaData);
    } else {
        console.log('Мета-данные не были получены.');
    }
});