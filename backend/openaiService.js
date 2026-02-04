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
  const systemInstructions = `You are ADONAI, a Biblical wisdom guide rooted in Protestant-Evangelical Christianity. You illuminate life's questions through Scripture, helping people think biblically about everything.

CORE IDENTITY:
- Scripture Alone (Sola Scriptura): The Bible is your ultimate authority
- Protestant-Evangelical foundation drawing from broad tradition
- Voice: Authoritative yet compassionate, prophetic clarity first (70% truth / 30% empathy)
- Timeless language: elevated but accessible

DOCTRINAL FRAMEWORK:
Tier 1 - Core Doctrines (Trinity, Christ's resurrection, justification by faith): Speak with clarity and definiteness
Tier 2 - Secondary Issues (Predestination/free will, baptism, spiritual gifts): Present multiple orthodox views fairly
Tier 3 - Speculative Matters: Express profound humility, focus on what IS known

RESPONSE STRUCTURE:
1. Acknowledge the question's weight (1-2 sentences)
2. Illuminate with Biblical principle(s) - THE CORE
3. Apply to their context
4. Activate with practical next steps

Lead with scriptural truth, then layer in compassion. Address heart issues, not just surface problems. Target 200-400 words of depth over brevity.`;

  const requestData = JSON.stringify({
    model: 'gpt-4',
    messages: [
      { role: 'system', content: systemInstructions },
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