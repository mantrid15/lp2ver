async function fetchMetaDataOne(url) {
    const apiUrl = `https://tools.buzzstream.com/metaDataService?url=${encodeURIComponent(url)}`;

    try {
        const response = await fetch(apiUrl);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log(data);
    } catch (error) {
        console.error('Ошибка при получении данных:', error);
    }
}

const fetchMetaData = async (url) => {
    console.log('Запрос к API:', url);
    const apiUrl = `https://tools.buzzstream.com/metaDataService?url=${encodeURIComponent(url)}`;
    try {
        const response = await fetch(apiUrl);
        console.log('Ответ от API:', response);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Ошибка при получении данных:', error);
        return { error: 'Ошибка при получении информации' };
    }
};


// Пример использования функции
// fetchMetaDataOne('https://habr.com/ru/articles/575050/');
fetchMetaDataOne('https://youtu.be/JTWqezuxFyU');
// fetchMetaData('https://habr.com/ru/articles/575050/');