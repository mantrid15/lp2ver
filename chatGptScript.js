import natural from 'natural';

function generateTags(title, description, keywords) {
    const tokenizer = new natural.WordTokenizer();

    // Объединяем входные данные в одну строку
    const combinedText = `${title} ${description} ${keywords}`;

    // Токенизируем текст
    const tokens = tokenizer.tokenize(combinedText.toLowerCase());

    // Подсчитываем частоту слов
    const frequency = tokens.reduce((acc, token) => {
        if (!acc[token]) acc[token] = 0;
        acc[token]++;
        return acc;
    }, {});

    // Сортируем слова по частоте
    const sortedTokens = Object.entries(frequency)
        .sort((a, b) => b[1] - a[1])
        .map(([word]) => word);

    // Фильтруем общеупотребительные слова, глаголы и прилагательные
    const stopwords = natural.stopwords;
    const tags = sortedTokens.filter(word => {
        if (stopwords.includes(word)) return false;
        if (/[a-zA-Z]+ing$/.test(word)) return false; // Простая проверка на глаголы (окончание -ing)
        if (word.length < 3) return false; // Убираем короткие слова
        return true;
    });

    // Возвращаем до 3-х самых релевантных тегов
    return tags.slice(0, 3);
}

// Пример использования
const title = "Model Context Protocol от Spring AI в Java SDK – новый стандарт для интеграции ИИ в экосистеме Java / Хабр";
const description = "Новый перевод от команды Spring АйО расскажет вам, что такое Model Context Protocol (MCP) и как его внедрение в экосистему Java упрощает жизнь разработчикам систем, в работе которых используется...";
// const keywords = "JavaScript, coding, tutorial, web development";
const keywords = "";
// const title = "ОГРОМНЫЙ обзор и сравнение PyCharm и Visual Studio Code - YouTube";
// const description = "Смотрим на веб-сайты PyCharm и VSC, сравниваем интерфейс, удобство работы и функциональность. Ну и PyCharm как всегда отличился, мда. Это видео создано исклю...";
// const keywords = [  "java", " mcp", " springai"," sdk"," llm", " protocol"];

console.log(generateTags(title, description, keywords));
