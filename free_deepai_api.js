(async function() {
    const resp = await fetch('https://api.deepai.org/api/chat', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'api-key': ' 447c9662-2c32-4219-a06c-e221dbe676e7'
        },
        body: JSON.stringify({
            text: "YOUR_TEXT_URL",
        })
    });

    const data = await resp.json();
    console.log(data);
})()
