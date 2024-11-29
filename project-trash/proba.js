const fetchMetaSerp = async (url) => {
    // https://serp.tools/ru/tools/title-description-h1
    try {
        const response = await fetch('https://api.serp.tools/api/v1/tools/title-description-h1/', {
            method: 'POST',
            headers: {
                'accept-language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7,tr;q=0.6',
                'content-type': 'application/json;charset=UTF-8',
       },
            body: JSON.stringify({
                'links': [url]
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        const item = data.data.items[0]; // Извлекаем первый элемент из массива items
        const content = item.content; // Получаем контент

        // Формируем объект с нужными данными
        const result = {
            url: item.url,
            title: content.title.value,
            description: content.description.value,
            keywords: '' // Здесь можно добавить логику для извлечения ключевых слов, если это необходимо
        };

        return result; // Возвращаем результат
    } catch (error) {
        console.error('Ошибка при выполнении запроса:', error);
        return { error: 'Ошибка при получении информации' };
    }
};

// Пример использования:
fetchMetaSerp('https://github.com/FranckFreiburger/vue3-sfc-loader/issues/14#issuecomment-758794153')
    .then(result => console.log(result))
    .catch(error => console.error('Ошибка:', error));