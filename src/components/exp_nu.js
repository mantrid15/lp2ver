// вытягивает описание из ссылки

import translate from 'translate-google';
import axios from 'axios';
import * as cheerio from 'cheerio';

// const mainUrl= 'https://github.com/FranckFreiburger/vue3-sfc-loader/discussions/34'
// const mainUrl= 'https://github.com/FranckFreiburger/vue3-sfc-loader/issues/14#issuecomment-758794153'
// const mainUrl= 'https://www.deep-ml.com/'

//

export async function getPageInfo(url) {
    const translateText = async (text) => {
        try {
            return await translate(text, { to: 'ru' });
        } catch (error) {
            console.error('Ошибка при переводе:', error);
            return '';
        }
    };

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

        return pageInfo;
    } catch (error) {
        console.error('Ошибка при получении информации о странице:', error);
        return { error: 'Ошибка при получении информации' };
    }
}





export default getPageInfo

// Пример использованияgetPageInf
// getPageInfo(mainUrl)
//     .then(info => console.log(info));