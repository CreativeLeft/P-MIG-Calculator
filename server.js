const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

const port = 3002;

// MIME types for different file extensions
const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
};

const server = http.createServer(async (req, res) => {
    // Handle CORS for all requests
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle Google Sheets proxy
    if (req.url.startsWith('/api/sheets')) {
        // Use the correct published CSV URL provided by user
        const sheetUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRwLgBkywXJZUQAHdXLrfoxHIdro9wrp7XnSa61OptNi--Y2Mt53kJvWa3CNqeFXOQRDsklfewfF98D/pub?output=csv';
        
        console.log('Fetching from:', sheetUrl);

        const options = {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        };

        const makeRequest = (url) => {
            https.get(url, options, (proxyRes) => {
                console.log('Response status:', proxyRes.statusCode);
                console.log('Response headers:', proxyRes.headers);
                
                // Handle redirects
                if (proxyRes.statusCode === 301 || proxyRes.statusCode === 302 || proxyRes.statusCode === 307) {
                    const redirectUrl = proxyRes.headers.location;
                    console.log('Following redirect to:', redirectUrl);
                    return makeRequest(redirectUrl);
                }
                
                if (proxyRes.statusCode === 403) {
                    console.error('403 Forbidden - Sheet may not be publicly accessible');
                    res.writeHead(403, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Sheet access forbidden. Please check sharing settings.' }));
                    return;
                }
                
                if (proxyRes.statusCode !== 200) {
                    console.error(`Unexpected status: ${proxyRes.statusCode}`);
                    res.writeHead(proxyRes.statusCode, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: `HTTP ${proxyRes.statusCode}` }));
                    return;
                }
                
                let data = '';
                
                proxyRes.on('data', (chunk) => {
                    data += chunk;
                });
                
                proxyRes.on('end', () => {
                    console.log('Data received length:', data.length);
                    console.log('First 200 chars:', data.substring(0, 200));
                    
                    res.writeHead(200, { 
                        'Content-Type': 'text/csv',
                        'Access-Control-Allow-Origin': '*'
                    });
                    res.end(data);
                });
            }).on('error', (error) => {
                console.error('Sheets proxy error:', error);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Failed to fetch sheet data' }));
            });
        };
        
        makeRequest(sheetUrl);
        return;
    }

    let filePath = '.' + req.url;
    if (filePath === './') {
        filePath = './index.html';
    }

    const extname = String(path.extname(filePath)).toLowerCase();
    const contentType = mimeTypes[extname] || 'application/octet-stream';

    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code === 'ENOENT') {
                res.writeHead(404, { 'Content-Type': 'text/html' });
                res.end('<h1>404 - File Not Found</h1>', 'utf-8');
            } else {
                res.writeHead(500);
                res.end(`Server Error: ${error.code}`, 'utf-8');
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
});

server.listen(port, () => {
    console.log(`🚀 Server running at http://localhost:${port}/`);
    console.log(`📊 Your pricing calculator is ready!`);
});
