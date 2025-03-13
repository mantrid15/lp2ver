import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
// Установите ваш токен

// Ваш API-токен Hugging Face
const API_TOKEN = process.env.HF_TOKEN_AI;

// Список моделей
const models = [
    // 'microsoft/Phi-3-mini-4k-instruct',
    // 'gpt2',
    // "gpt2",
    // "distilgpt2",
    // "EleutherAI/gpt-neo-1.3B",
    // "google/flan-t5-small",
    // "facebook/bart-base",
    // "roberta-base",
    // "distilbert-base-uncased",
    // "bigscience/bloom-560m",
    // "stabilityai/stablelm-base-alpha-7b",
    // "mistralai/Mistral-7B-v0.1",
    // "OpenAssistant/oasst-sft-4-pythia-12b-epoch-3.5",
    // "tiiuae/falcon-7b",
    // "meta-llama/Llama-2-7b-chat-hf",
    // "microsoft/phi-2",
    // "HuggingFaceH4/zephyr-7b-beta",
    // "microsoft/Phi-3-mini-4k-instruct",
    // "siegfred/aaditya-Llama3-OpenBioLLM-70B"\
    "mistralai/Mistral-7B-Instruct-v0.3"
];

// Функция для отправки запроса к модели
async function queryModel(model, inputText) {
    const url = `https://api-inference.huggingface.co/models/${model}`;
    const headers = {
        'Authorization': `Bearer ${API_TOKEN}`,
        'Content-Type': 'application/json'
    };
    const body = JSON.stringify({ inputs: inputText });

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: headers,
            body: body
        });

        if (!response.ok) {
            throw new Error(`Ошибка запроса: ${response.statusText}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error(`Ошибка при запросе к модели ${model}:`, error);
        return null;
    }
}

// Функция для обработки всех моделей
async function queryAllModels(inputText) {
    for (const model of models) {
        console.log(`Отправка запроса к модели: ${model}`);
        const result = await queryModel(model, inputText);
        if (result) {
            console.log(`Результат от модели ${model}:`, result);
        } else {
            console.log(`Модель ${model} не вернула результат.`);
        }
    }
}

// Пример использования
// const inputText = 'What is the capital of France?';
const inputText = 'write me a python code to reverse a list 1, 2, 3,5 ';
queryAllModels(inputText);