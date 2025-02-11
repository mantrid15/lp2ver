//  эксперементальная функция парсинга страницы.
import fetch from 'node-fetch';
import { JSDOM } from 'jsdom';
const url= 'https://lemanapro.ru/product/betonkontakt-cerezit-ct19-15-kg-13434318/'

const getPageInfo = async (url) => {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const html = await response.text();

        // Используем JSDOM для парсинга HTML
        const dom = new JSDOM(html);
        const document = dom.window.document;

        const info = {
            url,
            title: document.title,
            description: document.querySelector('meta[name="description"]')
                ? document.querySelector('meta[name="description"]').content
                : '',
            keywords: document.querySelector('meta[name="keywords"]')
                ? document.querySelector('meta[name="keywords"]').content
                : ''
        };

        return info;
    } catch (error) {
        console.error('Ошибка при получении информации о странице:', error);
        return { error: 'Ошибка при получении информации' };
    }
};
// export default getPageInfo;
// Пример использования
getPageInfo(url).then(info => {
    console.log('Информация о странице:', info);
}).catch(error => {
    console.error(error);
});