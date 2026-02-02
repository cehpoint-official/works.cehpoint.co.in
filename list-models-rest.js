const https = require('https');
const fs = require('fs');

const env = fs.readFileSync('.env.local', 'utf8');
const keyMatch = env.match(/GEMINI_API_KEY=([^\s]+)/);
if (!keyMatch) {
    console.error('API Key not found in .env.local');
    process.exit(1);
}
const apiKey = keyMatch[1];

https.get(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`, (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
        try {
            const parsed = JSON.parse(data);
            if (parsed.models) {
                console.log('Available Models:');
                parsed.models.forEach(m => console.log(m.name));
            } else {
                console.log('No models found, response:', data);
            }
        } catch (e) {
            console.log('Error parsing JSON:', data);
        }
    });
}).on('error', (err) => {
    console.error('Error: ' + err.message);
});
