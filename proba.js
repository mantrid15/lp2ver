// Импортируем axios
import axios from 'axios';

// Функция для получения данных
const fetchData = () => {
    axios.get('/api/metaDataService')
        .then(response => {
            console.log(response.data); // Выводим данные в консоль
        })
        .catch(error => {
            console.error('Ошибка при получении данных:', error); // Обработка ошибок
        });
};

// Вызов функции
fetchData();