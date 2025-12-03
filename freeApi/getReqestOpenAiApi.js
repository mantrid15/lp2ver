import axios from 'axios';
import dotenv from 'dotenv';

// Загрузите переменные окружения из файла .env
dotenv.config({ path: '.env.development.local' });

const OPENAI_API_KEY = process.env.OPEN_AI_API_KEY;
const OPENAI_API_URL = 'https://api.openai.com/v1/completions';

async function checkOpenAIApiValidity() {
    try {
        const response = await axios.get('https://api.openai.com/v1/models', {
            headers: {
                'Authorization': `Bearer ${OPENAI_API_KEY}`
            }
        });
        console.log('OpenAI API доступен и валиден.');
        return true;
    } catch (error) {
        console.error('Ошибка при проверке доступности OpenAI API:', error);
        return false;
    }
}

async function generateTags(title, description, keywords) {
    const combinedString = `${title} ${description} ${keywords}`.trim();

    const prompt = `Identify three tags that you would use to characterize the following string if you needed to assign a clear classification defining the field or domain of knowledge for this string. Do not use generic terms that do not characterize the content. If the information in the string is insufficient, you may progressively reduce the number of returned tags to one. Also, avoid using verbs, participles, or adjectives. The recommended tags should include terms, names, or titles. Return a comma-separated string. String: "${combinedString}"`;

    try {
        const response = await axios.post(OPENAI_API_URL, {
            model: "text-davinci-003",
            prompt: prompt,
            max_tokens: 60,
            temperature: 0.5
        }, {
            headers: {
                'Authorization': `Bearer ${OPENAI_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        const tags = response.data.choices[0].text.trim();
        return tags;
    } catch (error) {
        console.error('Error while requesting OpenAI API:', error);
        return null;
    }
}


async function main() {
    const isValid = await checkOpenAIApiValidity();
    if (!isValid) return;

    const title = "Artificial Intelligence";
    const description = "The study and development of systems capable of performing tasks that require human intelligence.";
    const keywords = "AI, machine learning, neural networks";

    const tags = await generateTags(title, description, keywords);
    if (tags) {
        console.log('Рекомендуемые теги:', tags);
    }
}

main();