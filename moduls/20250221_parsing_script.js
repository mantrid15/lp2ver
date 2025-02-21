import urlMetadata from 'url-metadata';

// Функция для получения метаданных из URL
async function fetchMetadata(url, options = {}) {
    try {
        // Получаем метаданные из указанного URL с использованием переданных опций
        const metadata = await urlMetadata(url, options);
        // Выводим полученные метаданные в консоль
        console.log(metadata);
    } catch (err) {
        // Обрабатываем возможные ошибки
        console.error('Ошибка при получении метаданных:', err);
    }
}

// Опции запроса (по умолчанию можно не указывать)
const options = {
    // Пользовательские заголовки запроса
    requestHeaders: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://www.google.com/'
    },
    // Настройка кэша для запроса
    cache: 'no-cache',
    // Режим запроса (например, 'cors', 'no-cors', 'same-origin')
    mode: 'cors',
    // Кодировка для декодирования ответа ('auto' для автоопределения)
    decode: 'auto',
    // Таймаут запроса в миллисекундах
    timeout: 10000,
    // Длина описания для обрезки
    descriptionLength: 750,
    // Принудительное использование HTTPS для изображений
    ensureSecureImageRequest: true,
    // Возвращение сырого тела ответа как строки
    includeResponseBody: false,
    // Альтернативный способ: передача объекта Response для парсинга
    parseResponseObject: null,
};


// Пример использования функции для получения метаданных с опциями
(async () => {
    const url = 'https://www.kdnuggets.com/data-science-showdown-tools-gain-ground-2025';
    await fetchMetadata(url, options);
})();

// Альтернативный пример: парсинг объекта Response вместо URL
/*
(async () => {
    try {
        // Выполняем запрос самостоятельно
        const response = await fetch('https://www.npmjs.com/package/url-metadata');
        // Парсим метаданные из объекта Response
        const metadata = await urlMetadata(null, { parseResponseObject: response });
        console.log(metadata);
    } catch (err) {
        console.error('Ошибка при парсинге Response:', err);
    }
})();*/
