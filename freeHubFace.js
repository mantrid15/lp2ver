import axios from 'axios';

// Установите ваш токен
const HF_TOKEN = "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"; // Замените на ваш токен
const repo_id = "TinyLlama/TinyLlama-1.1B-Chat-v1.0";

async function callLLM(prompt) {
    const txt = '';
    try {
        const response = await axios.post(
            `https://api-inference.huggingface.co/models/${repo_id}`,
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
        // txt = response.data[0].generated_text;

        // console.log(txt);
        console.log(response.data[0].generated_text)

        return response.data[0].generated_text;
    } catch (error) {
        console.error('Ошибка при запросе:', error.response ? error.response.data : error.message);
    }
}

callLLM("tell me about ternary operator in python").then(response => {
    console.log(response);
});