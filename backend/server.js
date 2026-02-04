/*
 * Simple Node.js HTTP server for the Adonai.ai monorepo. This server
 * statically serves the frontend assets and exposes an API endpoint for
 * interacting with the OpenAI API. It intentionally avoids third‑party
 * dependencies by leveraging the built‑in http and fs modules. The API key
 * should be provided via the OPENAI_API_KEY environment variable.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { generateResponse } = require('./openaiService');

const PORT = process.env.PORT || 3000;

/**
 * Reads a file from the frontend directory and returns a { status, content, contentType } object.
 * Returns a 404 response if the file does not exist.
 *
 * @param {string} filePath Relative path to the file within the frontend directory.
 */
function serveStatic(filePath) {
  const fullPath = path.join(__dirname, '..', 'frontend', filePath);
  if (!fs.existsSync(fullPath)) {
    return { status: 404, content: 'Not Found', contentType: 'text/plain' };
  }
  const ext = path.extname(fullPath);
  const contentType = ext === '.js' ? 'application/javascript' : 'text/html';
  const content = fs.readFileSync(fullPath);
  return { status: 200, content, contentType };
}

/**
 * Handles incoming HTTP requests.
 *
 * @param {http.IncomingMessage} req
 * @param {http.ServerResponse} res
 */
async function requestListener(req, res) {
  const { method, url } = req;
  // Handle CORS preflight requests
  if (method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    res.end();
    return;
  }

  // Set default CORS header for all responses
  const defaultHeaders = {
    'Access-Control-Allow-Origin': '*'
  };

  if (method === 'GET' && (url === '/' || url === '/index.html')) {
    const { status, content, contentType } = serveStatic('index.html');
    res.writeHead(status, { 'Content-Type': contentType, ...defaultHeaders });
    res.end(content);
    return;
  }
  if (method === 'GET' && url === '/script.js') {
    const { status, content, contentType } = serveStatic('script.js');
    res.writeHead(status, { 'Content-Type': contentType, ...defaultHeaders });
    res.end(content);
    return;
  }
  if (method === 'POST' && url === '/api/chat') {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', async () => {
      try {
        const { prompt } = JSON.parse(body || '{}');
        if (!prompt) {
          res.writeHead(400, { 'Content-Type': 'application/json', ...defaultHeaders });
          res.end(JSON.stringify({ error: 'Missing prompt' }));
          return;
        }
        const message = await generateResponse(prompt);
        res.writeHead(200, { 'Content-Type': 'application/json', ...defaultHeaders });
        res.end(JSON.stringify({ message }));
      } catch (err) {
        // Differentiate between OpenAI API errors and other errors
        const status = err.message.startsWith('OpenAI API') ? 502 : 500;
        res.writeHead(status, { 'Content-Type': 'application/json', ...defaultHeaders });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }
  // Fallback for any other requests
  res.writeHead(404, { 'Content-Type': 'text/plain', ...defaultHeaders });
  res.end('Not Found');
}

const server = http.createServer(requestListener);
server.listen(PORT, () => {
  console.log(`Adonai.ai server running on http://localhost:${PORT}`);
});
