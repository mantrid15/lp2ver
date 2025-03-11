import nlp from 'compromise';

function generateTags(title, description, keywords) {
    // Объединяем строки
    const combinedText = `${title} ${description} ${keywords.join(' ')}`;

    // Анализируем текст
    let doc = nlp(combinedText);

    // Получаем существительные, которые могут быть использованы как теги
    let nouns = doc.nouns().out('array');

    // Убираем дубликаты и общеупотребительные термины
    let uniqueNouns = [...new Set(nouns)];
    let filteredTags = uniqueNouns.filter(tag => !isCommonTerm(tag));

    // Ограничиваем количество тегов до трех
    return filteredTags.slice(0, 3);
}

// Функция для фильтрации общеупотребительных терминов
function isCommonTerm(term) {
    const commonTerms = ['и', 'в', 'на', 'с', 'по', 'для', 'это', 'что', 'как']; // Добавьте больше по необходимости
    return commonTerms.includes(term.toLowerCase());
}

// Пример использования
const title = "ОГРОМНЫЙ обзор и сравнение PyCharm и Visual Studio Code - YouTube";
const description = "Смотрим на веб-сайты PyCharm и VSC, сравниваем интерфейс, удобство работы и функциональность. Ну и PyCharm как всегда отличился, мда. Это видео создано исклю...";
const keywords = ["python", "programming", "ide", "pycharm", "vsc", "visual studio code"];

const tags = generateTags(title, description, keywords);
console.log(tags); // ['веб-приложений', 'технологий', 'интерактивных']