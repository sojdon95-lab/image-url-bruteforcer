const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static('public'));

// Function to generate random string
function generateRandomString(charset, length) {
  let result = '';
  for (let i = 0; i < length; i++) {
    result += charset[Math.floor(Math.random() * charset.length)];
  }
  return result;
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

// Parse URL and extract ID positions and their lengths
function parseURLPattern(url) {
  try {
    const urlObj = new URL(url);
    const fullPath = urlObj.pathname;
    const parts = fullPath.split('/').filter(p => p);
    
    const idPositions = [];
    
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      // Extract base name without extension
      const baseName = part.split('.')[0];
      
      // Check if it looks like a hash/ID (long alphanumeric string)
      if (baseName && baseName.length > 10 && /^[a-zA-Z0-9]+$/.test(baseName)) {
        idPositions.push({
          index: i,
          value: baseName,
          length: baseName.length,
          hasExtension: part.includes('.')
        });
      }
    }
    
    return { 
      baseUrl: url,
      parts,
      idPositions,
      domain: urlObj.origin
    };
  } catch (error) {
    return null;
  }
}

// Analyze multiple URLs to find patterns
function analyzeMultipleURLs(urls) {
  if (!urls || urls.length === 0) return null;
  
  const patterns = urls.map(url => parseURLPattern(url));
  
  if (!patterns[0]) return null;
  
  // Find common structure
  const basePattern = patterns[0];
  const commonIdPositions = [];
  
  // Get ID positions that exist in all URLs
  if (basePattern.idPositions.length > 0) {
    for (let i = 0; i < basePattern.idPositions.length; i++) {
      const idPos = basePattern.idPositions[i];
      
      // Check if this position exists in other URLs with variable values
      let isCommon = true;
      const lengths = [idPos.length];
      
      for (let j = 1; j < patterns.length; j++) {
        if (patterns[j] && patterns[j].idPositions[i]) {
          lengths.push(patterns[j].idPositions[i].length);
        } else {
          isCommon = false;
          break;
        }
      }
      
      if (isCommon) {
        commonIdPositions.push({
          index: idPos.index,
          lengths: lengths,
          averageLength: Math.round(lengths.reduce((a, b) => a + b) / lengths.length)
        });
      }
    }
  }
  
  return {
    domain: basePattern.domain,
    parts: basePattern.parts,
    idPositions: commonIdPositions,
    urlCount: urls.length
  };
}

// Generate URLs with variations at multiple ID positions
function generateURLsFromPattern(baseUrl, pattern, charSet, idLength, extension, maxUrls = 100) {
  const urlObj = parseURLPattern(baseUrl);
  if (!urlObj) return [];
  
  const charset = getCharset(charSet);
  const urls = [];
  
  const idPositions = pattern ? pattern.idPositions : urlObj.idPositions;
  
  if (idPositions.length === 0) {
    return urls;
  }
  
  // Generate variations
  for (let i = 0; i < maxUrls; i++) {
    const newParts = [...urlObj.parts];
    
    // Vary all ID positions
    for (const idPos of idPositions) {
      const length = idLength || idPos.averageLength || idPos.length || 64;
      const randomId = generateRandomString(charset, length);
      
      const originalPart = newParts[idPos.index];
      const hasExtension = originalPart && originalPart.includes('.');
      
      if (hasExtension) {
        newParts[idPos.index] = randomId + (extension || '.jpg');
      } else {
        newParts[idPos.index] = randomId;
      }
    }
    
    const newUrl = urlObj.domain + '/' + newParts.join('/');
    urls.push(newUrl);
  }
  
  return urls;
}

// API endpoint to test URLs
app.post('/api/bruteforce', async (req, res) => {
  try {
    const { baseUrl, urls, charSet, idLength, extension } = req.body;
    
    if (!baseUrl && (!urls || urls.length === 0)) {
      return res.status(400).json({ error: 'Please provide a base URL or multiple sample URLs' });
    }
    
    let pattern = null;
    let testBaseUrl = baseUrl;
    
    // If multiple URLs provided, analyze them for patterns
    if (urls && urls.length > 0) {
      pattern = analyzeMultipleURLs(urls);
      if (!pattern) {
        return res.status(400).json({ error: 'Could not analyze URL patterns' });
      }
      testBaseUrl = urls[0]; // Use first URL as reference
    }
    
    const urlsToTest = generateURLsFromPattern(testBaseUrl, pattern, charSet, idLength, extension, 150);
    
    if (urlsToTest.length === 0) {
      return res.status(400).json({ error: 'Could not generate URLs. Check your input format.' });
    }
    
    const validImages = [];
    
    // Test each URL with timeout
    const testPromises = urlsToTest.map(url => 
      axios.head(url, { 
        timeout: 5000,
        maxRedirects: 0,
        validateStatus: (status) => status === 200
      })
      .then(() => url)
      .catch(() => null)
    );
    
    const results = await Promise.all(testPromises);
    
    for (const result of results) {
      if (result) {
        validImages.push(result);
      }
    }
    
    res.json({ 
      success: true,
      foundImages: validImages,
      totalTested: urlsToTest.length,
      patternAnalysis: pattern ? {
        idPositions: pattern.idPositions,
        sampleURLsAnalyzed: urls ? urls.length : 1
      } : null
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