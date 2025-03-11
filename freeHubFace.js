import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
// Установите ваш токен
const HF_TOKEN = process.env.HF_TOKEN_AI; // Замените на ваш токен

// const repoId = "TinyLlama/TinyLlama-1.1B-Chat-v1.0";
// const repoId = "microsoft/Phi-3-mini-4k-instruct";

// const repoId = "gpt2";

const repoId = "HuggingFaceH4/zephyr-7b-beta";
// только для английского языка

// const title = "ОГРОМНЫЙ обзор и сравнение PyCharm и Visual Studio Code - YouTube";
const title = "Стармер выразил готовность «поддержать сделку» по Украине войсками и самолетами";
// const description = "Смотрим на веб-сайты PyCharm и VSC, сравниваем интерфейс, удобство работы и функциональность. " +
const description = "Великобритания готова разместить вооруженные силы и использовать самолеты для поддержки украинского урегулирования, заявил британский премьер Кир Стармер.";
const keywords = "";
// const keywords = ["python", "programming", "ide", "pycharm", "vsc", "visual studio code"];

// const title = "Artificial Intelligence";
// const description = "The study and development of systems capable of performing tasks that require human intelligence.";
// const keywords = "AI, machine learning, neural networks";
const teg = `${title} ${description} ${keywords}`.trim();
const tegPrompt = `Identify three tags that you would use to characterize the following row if you were to assign 
a clear classification that defined the area or domain of knowledge for that row. Avoid using general terms that do not 
characterize the content. If the row does not provide enough information, you can gradually reduce the number of tags
 returned to one. Also avoid using verbs, participles, or adjectives. Recommended tags should include terms, names, 
 or titles. No reasoning or intermediate data is needed. Return only comma-separated strings."${teg}"`;


async function callLLM(prompt) {
    // console.log('HF_TOKEN:', process.env.HF_TOKEN_AI);
    // const repoId = "Qwen/Qwen2.5-Coder-32B-Instruct";
    const repoId = "mistralai/Mistral-7B-Instruct-v0.3";

    try {
        const response = await axios.post(
            `https://api-inference.huggingface.co/models/${repoId}`,
            {
                inputs: prompt,
                parameters: { max_new_tokens: 200 },
                task: "text-generation",
            },
            {
                headers: {
                    Authorization: `Bearer ${HF_TOKEN}`,
                },
            }
        );

        let generatedText = response.data[0].generated_text;
        generatedText = generatedText.replace(tegPrompt, '').trim();
        return generatedText;
        // return response.data[0].generated_text;
    } catch (error) {
        console.error("Error calling the LLM:", error);
        return null;
    }
}
(async () => {
    const response = await callLLM(tegPrompt);
    console.log(response);
})();