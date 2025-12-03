import dotenv from 'dotenv';

dotenv.config({ path: '.env.development' });
const DEEP_AI_API_KEY = process.env.DEEP_AI_API_KEY;

(async function() {
    const resp = await fetch('https://api.deepai.org/api/chat', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'api-key': DEEP_AI_API_KEY
        },
        body: JSON.stringify({
            text: "YOUR_TEXT_URL",
        })
    });

    const data = await resp.json();
    console.log(data);
})()
