import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config({ path: '../../.env.development' });

const HF_TOKEN = process.env.HF_TOKEN_AI; // Замените на ваш токен
console.log('HF_TOKEN:', HF_TOKEN); // Проверка токена



export async function generateTags(title, description, keywords = "") {
    const repoId = "mistralai/Mistral-7B-Instruct-v0.3";
    const teg = `${title} ${description} ${keywords}`.trim();
    const tegPrompt = `Identify three tags that you would use to characterize the following row if you were to assign 
    a clear classification that defined the area or domain of knowledge for that row. Avoid using general terms that do not 
    characterize the content. If the row does not provide enough information, you can gradually reduce the number of tags
    returned to one. Also avoid using verbs, participles, or adjectives. Recommended tags should include terms, names, 
    or titles. No reasoning or intermediate data is needed. Return only comma-separated strings."${teg}"`;

    try {
        const response = await axios.post(
            `https://api-inference.huggingface.co/models/${repoId}`,
            {
                inputs: tegPrompt,
                parameters: { max_new_tokens: 200 },
                task: "text-generation",
            },
            {
                headers: {
                    Authorization: `Bearer ${HF_TOKEN}`,
                },
            }
        );

        console.log(response.data); // Проверка структуры ответа

        let generatedText = response.data[0].generated_text;
        generatedText = generatedText.replace(tegPrompt, '').trim();
        return generatedText;
    } catch (error) {
        console.error("Error calling the LLM:", error.response ? error.response.data : error.message);
        return ""; // Возвращаем пустую строку в случае ошибки
    }
}

// (async () => {
//     const title = "Стармер выразил готовность «поддержать сделку» по Украине войсками и самолетами";
//     const description = "Великобритания готова разместить вооруженные силы и использовать самолеты для поддержки украинского урегулирования, заявил британский премьер Кир Стармер.";
//     const response = await generateTags(title, description);
//     console.log(response);
// })();