import OpenAI from "openai";
// код рабочий но надо платить для api
const openai = new OpenAI({
    baseURL: 'https://api.deepseek.com',
    apiKey: 'sk-938bb5e427e948df90c77b4eec6194d8'
});

async function main(title, description, keywords) {
    const combinedString = `${title} ${description} ${keywords}`.trim();
    const prompt = `Identify three tags that you would use to characterize the following string if you needed to assign a clear classification defining the field or domain of knowledge for this string. Do not use generic terms that do not characterize the content. If the information in the string is insufficient, you may progressively reduce the number of returned tags to one. Also, avoid using verbs, participles, or adjectives. The recommended tags should include terms, names, or titles. Return a comma-separated string. String: "${combinedString}"`;

    const completion = await openai.chat.completions.create({
        messages: [{
            role: "system",
            content: prompt }],
        model: "deepseek-chat",
    });

    console.log(completion.choices[0].message.content);
}

main();