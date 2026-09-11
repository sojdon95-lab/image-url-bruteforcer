const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Function to generate URL variations
function generateURLs(baseUrl, charSet, idLength, extension) {
  const urls = [];
  const charset = getCharset(charSet);
  
  // Extract the base pattern (everything before the ID)
  const urlParts = baseUrl.split('/');
  const filename = urlParts[urlParts.length - 1];
  const basePattern = baseUrl.replace(filename, '');
  
  // Generate random IDs (for demo, generate 10 variations)
  for (let i = 0; i < 10; i++) {
    let randomId = '';
    for (let j = 0; j < idLength; j++) {
      randomId += charset[Math.floor(Math.random() * charset.length)];
    }
    urls.push(basePattern + randomId + extension);
  }
  
  return urls;
}

function getCharset(type) {
  switch(type) {
    case 'hex':
      return '0123456789abcdef'.split('');
    case 'alphanumeric':
      return '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
    case 'numeric':
      return '0123456789'.split('');
    default:
      return '0123456789abcdef'.split('');
  }
}

// API endpoint to test URLs
app.post('/api/bruteforce', async (req, res) => {
  try {
    const { baseUrl, charSet, idLength, extension } = req.body;
    
    if (!baseUrl) {
      return res.status(400).json({ error: 'Base URL is required' });
    }
    
    const urlsToTest = generateURLs(baseUrl, charSet, idLength, extension);
    const validImages = [];
    
    // Test each URL
    for (const url of urlsToTest) {
      try {
        const response = await axios.head(url, { timeout: 5000 });
        if (response.status === 200) {
          validImages.push(url);
        }
      } catch (error) {
        // URL doesn't exist, continue
        continue;
      }
    }
    
    res.json({ 
      success: true,
      foundImages: validImages,
      totalTested: urlsToTest.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Serve the HTML file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});