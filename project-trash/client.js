const axios = require('axios');

const fetchMetaData = async (url) => {
    try {
        const response = await axios.get(`http://localhost:3000/proxy?url=${encodeURIComponent(url)}`);
        return response.data;
    } catch (error) {
        console.error('Ошибка при получении данных:', error);
        return { error: 'Ошибка при получении информации' };
    }
};
fetchMetaData('https://www.jetbrains.com/ru-ru/webstorm/download/#section=windows')
    .then(data => console.log(data))
    .catch(err => console.error(err));