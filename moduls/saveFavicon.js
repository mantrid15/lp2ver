import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';
import sharp from 'sharp';

const faviconPath = '../favicons'

function getDomainName(url) {
    try {
        const parsedUrl = new URL(url);
        const hostname = parsedUrl.hostname; // Получаем имя хоста (например, www.youtube.com или vitametmortem.bandcamp.com)

        // Удаляем префикс "www."
        const cleanedHostname = hostname.replace(/^www\./, '');

        // Разделяем по '.' и получаем части домена
        const domainParts = cleanedHostname.split('.');

        // Если есть поддомен, возвращаем имя сайта с доменной зоной
        if (domainParts.length > 2) {
            return domainParts.slice(-3).join('_'); // Возвращаем последние три части (поддомен, домен и доменная зона)
        } else {
            return cleanedHostname.replace('.', '_'); // Если нет поддомена, возвращаем полное имя хоста
        }
    } catch (error) {
        console.error('Ошибка:', error);
        return null;
    }
}


async function transformSvg(filePath) {
    const extname = path.extname(filePath).toLowerCase();

    // Проверяем, является ли файл SVG
    if (extname !== '.svg') {
        return null; // Если не SVG, ничего не делаем
    }

    const outputFilePath = filePath.replace('.svg', '.ico');

    // Конвертируем SVG в ICO
    await sharp(filePath)
        .resize(64, 64) // Измените размер по необходимости
        .toFile(outputFilePath);

    return outputFilePath; // Возвращаем путь к файлу ICO
}


async function saveFavicon(url) {
    const placeholderFavicon = '../favicons/linzer.ico'; // Путь к заглушке
    try {
        // Получаем HTML-код страницы
        const response = await fetch(url);
        const html = await response.text();
        // Ищем тег <link> с фавиконом
        const faviconUrlMatch = html.match(/<link[^>]+rel=["'](?:shortcut icon|icon)["'][^>]+href=["']([^"']+)["']/i);
        let faviconUrl;
        if (faviconUrlMatch) {
            faviconUrl = new URL(faviconUrlMatch[1], url).href; // Преобразуем в абсолютный
        } else {
            faviconUrl = new URL('/favicon.ico', url).href; // Стандартное местоположение
        }
        // Проверяем, является ли фавикон валидным URL
        try {
            new URL(faviconUrl);
        } catch (e) {
            console.error('Неверный URL фавикона:', faviconUrl);
            return placeholderFavicon; // Возвращаем путь к заглушке
        }
        // Получаем фавикон
        const faviconResponse = await fetch(faviconUrl);
        if (!faviconResponse.ok) {
            throw new Error('Не удалось загрузить фавикон');
        }
        // Получаем имя домена и расширение
        const domainName = getDomainName(url);
        const extension = path.extname(faviconUrl); // Получаем расширение
        const icoFilePath = path.join(process.cwd(), '../favicons', `${domainName}.ico`); // Путь к ICO файлу

        // Если файл в формате SVG, конвертируем его в ICO
        if (extension === '.svg') {
            const svgBuffer = await faviconResponse.arrayBuffer();
            const tempSvgFilePath = path.join(process.cwd(), '../favicons', `${domainName}.svg`);
            // Сохраняем временно только для конвертации
            fs.writeFileSync(tempSvgFilePath, Buffer.from(svgBuffer)); // Сохраняем SVG для конвертации


            const icoPath = path.join(process.cwd(), '../favicons', `${domainName}.ico`);

            // ���������, ���������� �� ICO ����
            if (fs.existsSync(icoPath)) {
                console.log(`Фавикон загружен ранее: ${icoPath}`);
                fs.unlinkSync(tempSvgFilePath);
                return path.relative(process.cwd(), icoPath); // ���������� ���� � ������������� ICO �����
            }

            const convertedIcoPath = await transformSvg(tempSvgFilePath);
            if (convertedIcoPath) {
                console.log(`Фавикон конвертирован в ICO по адресу: ${convertedIcoPath}`);
                fs.unlinkSync(tempSvgFilePath);
                return path.relative(process.cwd(), convertedIcoPath); // Возвращаем относительный путь к сохраненному ICO
            }
        } else {
            // Сохраняем фавикон в папке
            const buffer = await faviconResponse.arrayBuffer();
            fs.writeFileSync(icoFilePath,Buffer.from(buffer));
            console.log(`Фавикон сохранен по адресу: ${icoFilePath}`);
            return path.relative(process.cwd(), icoFilePath); // Возвращаем относительный путь к сохраненному фавикону
        }
    } catch (error) {
        console.error('Ошибка:', error);
        return placeholderFavicon; // Возвращаем путь к заглушке
    }
}


// const link = 'https://vitametmortem.bandcamp.com/'
// const link = 'https://vitametmortem.bandcamp.com/album/death-metal-666-reedition-2018'
const link = 'https://bolt.new/'
//
// Пример использования
saveFavicon(link).then((result) => {
    console.log(`Ссылка на фавикон: ${result}`);
});