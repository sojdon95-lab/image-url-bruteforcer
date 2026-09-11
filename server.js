const express = require('express');
const axios = require('axios');
const cors = require('cors');
const crypto = require('crypto');

const app = express();
app.use(cors());
app.use(express.json());

// Mimic real browsers to avoid "Bot Detected" errors
const USER_AGENTS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36'
];

function sha256(buf) {
    return crypto.createHash('sha256').update(buf).digest('hex');
}

// Adds a random delay so the server doesn't ban your IP instantly
const sleep = (ms) => new Promise(res => setTimeout(res, ms + Math.floor(Math.random() * 1000)));

app.post('/scan', async (req, res) => {
    const { baseUrlList, sampleId, count } = req.body;
    
    if (!baseUrlList || !sampleId) {
        return res.status(400).json({ error: "Missing Base URLs or Sample ID" });
    }

    const urls = baseUrlList.split('\n').filter(url => url.trim() !== '');
    const results = [];

    console.log(`[!] Target: ${urls.length} URLs | Attempting ${count} guesses per target`);

    for (let templateUrl of urls) {
        let placeholderHash = null;

        for (let i = 0; i < count; i++) {
            // Generates a random string of the SAME length as the sampleId provided
            const randomId = Math.random().toString(36).substring(2, 2 + sampleId.length);
            const finalUrl = templateUrl.replace(sampleId, randomId);

            try {
                const response = await axios.get(finalUrl, {
                    responseType: 'arraybuffer',
                    timeout: 5000,
                    headers: {
                        'User-Agent': USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)],
                        'Accept': 'image/avif,image/webp,image/apng,image/jpeg,image/png',
                        'Referer': 'https://imgurtik-service13.top/'
                    }
                });

                const hash = sha256(response.data);
                
                // Use the first response of each base URL as the "Dummy/Cat" benchmark
                if (i === 0) placeholderHash = hash;

                if (hash !== placeholderHash) {
                    results.push({ url: finalUrl, status: 'MATCH', size: response.data.length });
                } else {
                    results.push({ url: finalUrl, status: 'PLACEHOLDER' });
                }
            } catch (e) {
                results.push({ url: finalUrl, status: 'ERROR', error: e.message });
            }
            await sleep(200); 
        }
    }
    res.json({ results });
});

app.listen(3000, () => console.log('🚀 XORTRON Image Engine active on http://localhost:3000'));
