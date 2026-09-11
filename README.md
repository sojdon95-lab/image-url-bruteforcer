# Image URL Bruteforcer

A tool to find related images by brute-forcing URL patterns. This application uses a Node.js backend to bypass CORS restrictions and safely test image URLs.

## Features

- 🔍 Analyze image URL patterns
- 🎯 Generate URL variations using different character sets
- ⚡ Server-side testing (bypasses CORS)
- 🖼️ Display found images in a grid
- 📋 List all valid image URLs

## Setup & Installation

### Prerequisites
- Node.js (v14 or higher)
- npm

### Installation Steps

1. **Clone the repository**
   ```bash
   git clone https://github.com/sojdon95-lab/image-url-bruteforcer.git
   cd image-url-bruteforcer
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the server**
   ```bash
   npm start
   ```
   
   For development with auto-reload:
   ```bash
   npm run dev
   ```

4. **Access the application**
   Open your browser and go to:
   ```
   http://localhost:3000
   ```

## How It Works

1. Enter a base image URL
2. Select your preferred character set (hex, alphanumeric, or numeric)
3. Specify the ID length to generate
4. Choose the file extension
5. Click "Start Bruteforce" to begin testing URLs
6. The server generates random ID variations and tests each URL
7. Valid images are displayed in a grid and listed below

## Configuration

### Character Sets
- **Hexadecimal**: 0-9, a-f (64 combinations)
- **Alphanumeric**: 0-9, a-z, A-Z (62 combinations)
- **Numeric**: 0-9 (10 combinations)

### ID Length
Adjustable from 10 to 100 characters (default: 64)

## Dependencies

- **express**: Web framework for Node.js
- **axios**: HTTP client for making requests
- **cors**: Middleware to handle CORS

## Why Node.js Backend?

Due to browser security policies (CORS - Cross-Origin Resource Sharing), direct JavaScript in the browser cannot make requests to external image servers. The Node.js backend acts as a proxy, allowing us to:

- Test image URLs from different domains
- Handle rate limiting safely
- Manage timeouts and errors
- Provide a secure, controlled environment

## Educational Purpose

This tool is designed for educational purposes to demonstrate:
- URL pattern recognition
- Brute-force concepts
- Server-side request handling
- CORS and web security principles

## Deployment

### Heroku
```bash
heroku create your-app-name
git push heroku main
```

### Other Platforms
Set the `PORT` environment variable:
```bash
PORT=8080 npm start
```

## License

MIT

## Disclaimer

This tool is for educational purposes only. Users are responsible for ensuring they have permission to access and test URLs. Unauthorized access to computer systems is illegal.