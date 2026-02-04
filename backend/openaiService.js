/*
 * OpenAI service wrapper for Adonai.ai
 *
 * This module provides a simple function to call the OpenAI Chat API. It uses
 * the built‑in https module to avoid pulling in third‑party dependencies. The
 * API key is read from the OPENAI_API_KEY environment variable. If no key
 * is provided, the call will be rejected. Consumers should catch errors
 * thrown by this module and handle them appropriately.
 */

const https = require('https');

/**
 * Sends a prompt to the OpenAI Chat API and returns the assistant's reply.
 *
 * @param {string} prompt The user's message to send to the model.
 * @returns {Promise<string>} The assistant's response.
 */
async function generateResponse(prompt) {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('Missing OPENAI_API_KEY environment variable');
  }
  const apiKey = process.env.OPENAI_API_KEY;
  const requestData = JSON.stringify({
    // Use the GPT‑4o model for improved reasoning and conciseness
    model: 'gpt-4o',
    messages: [
      // Provide a system prompt tailored to biblical wisdom
      { role: 'system', content: 'You are a wise biblical assistant who provides thoughtful and spiritually grounded answers based on scripture.' },
      { role: 'user', content: prompt }
    ]
  });

  const options = {
    hostname: 'api.openai.com',
    path: '/v1/chat/completions',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(requestData),
      'Authorization': `Bearer ${apiKey}`
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            const response = JSON.parse(data);
            const message = response.choices?.[0]?.message?.content;
            resolve(message);
          } catch (err) {
            reject(err);
          }
        } else {
          reject(new Error(`OpenAI API returned status ${res.statusCode}: ${data}`));
        }
      });
    });
    req.on('error', (err) => reject(err));
    req.write(requestData);
    req.end();
  });
}

module.exports = {
  generateResponse
};
