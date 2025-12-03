import nlp from 'compromise';
import dotenv from 'dotenv';
import stopword from 'stopword';
import natural from 'natural';

// dotenv.config({ path: '.env.development' });

function filterTermsAndNouns(words) {
    const filteredTerms = [];
    words.forEach(word => {
        // Используем compromise для анализа слова
        const doc = nlp(word);

        // Проверяем, является ли слово существительным
        if (doc.nouns().length > 0) {
            filteredTerms.push(word);
        }
    });

    return filteredTerms;
}

// const sw = require('stopword');
export function generateTags(title, description, keywords=[]) {
    // Преобразуем keywords в строку, если это массив
    if (Array.isArray(keywords)) {
        keywords = keywords.join(' '); // Объединяем в строку без запятых
    }
    // Убираем лишние пробелы
    keywords = keywords.trim();
    // Объединяем title, description и keywords в одну строку
    let combinedText = `${title} ${description} ${keywords}`;

    // Заменяем запятые на пробелы и преобразуем в нижний регистр
    combinedText = combinedText.replace(/,/g, ' ').toLowerCase();
    const wordsArray = combinedText.split(/\s+/);
    // Удаляем дубликаты
    const uniqueWords = [...new Set(filterTermsAndNouns(wordsArray))].filter(word => !isCommonTerm(word));
    // const uniqueWords = [...new Set(wordsArray)].filter(word => !isCommonTerm(word));
    // Ограничиваем количество тегов до трех
    return uniqueWords.slice(0, 3);
}
const commonTerms = [
    'и', 'в', 'на', 'с', 'по', 'для', 'это', 'что', 'как', 'we', 'to', 'you', 'your',
    'a', 'an', 'the', 'is', 'are', 'was', 'were', 'be', 'been', 'being','simplify',
    'have', 'has', 'had', 'having', 'do', 'does', 'did', 'doing',
    'if', 'then', 'else', 'but', 'or', 'because', 'since', 'until',
    'while', 'for', 'in', 'of', 'about', 'at', 'as', 'by', 'with',
    'from', 'to', 'up', 'down', 'over', 'under', 'after', 'before',
    'between', 'among', 'within', 'without', 'through', 'during',
    'along', 'across', 'against', 'around', 'near', 'about', 'above',
    'below', 'beyond', 'outside', 'inside', 'usage'
];
// Функция для фильтрации общеупотребительных терминов
function isCommonTerm(term) {
    // Проверяем, является ли слово стоп-словом на русском или английском языках
    return commonTerms.includes(term.toLowerCase());
}

// Пример использования
// const title = "Simplify Your computer Usage";
// const description = "We develop highest quality software to simplify Computer usage";
// const keywords = "Software development,freeware development,portable freeware, download page,sordum homepage, sordum software page,sordum download page";
// const keywords = "AI, machine learning, neural networks";

// const title = "ОГРОМНЫЙ обзор и сравнение PyCharm и Visual Studio Code - YouTube";
// const description = "Смотрим на веб-сайты PyCharm и VSC, сравниваем интерфейс, удобство работы и функциональность. Ну и PyCharm как всегда отличился, мда. Это видео создано исклю...";
// const keywords = ["python", "programming", "ide", "pycharm", "vsc", "visual studio code"];



// const tags = generateTags(title, description, keywords);
// console.log(tags); // ['веб-приложений', 'технологий', 'интерактивных']