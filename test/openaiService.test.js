/*
 * Tests for the openaiService module. These tests verify that the
 * generateResponse function behaves correctly when the API key is missing and
 * when a mock request is provided. Because the test environment does not
 * allow outbound network calls, the mock test monkey patches https.request
 * to simulate an API response. After each test, the original request
 * function is restored.
 */

const assert = require('assert');
const https = require('https');
const { generateResponse } = require('../backend/openaiService');

async function testMissingApiKey() {
  const originalKey = process.env.OPENAI_API_KEY;
  delete process.env.OPENAI_API_KEY;
  let threw = false;
  try {
    await generateResponse('Hello');
  } catch (err) {
    threw = true;
    assert.strictEqual(
      err.message,
      'Missing OPENAI_API_KEY environment variable',
      'generateResponse should throw a specific error when API key is missing'
    );
  }
  assert.ok(threw, 'generateResponse should throw when API key is not set');
  // Restore
  process.env.OPENAI_API_KEY = originalKey;
}

async function testMockRequest() {
  process.env.OPENAI_API_KEY = 'test-key';
  const originalRequest = https.request;
  // Monkey patch https.request to simulate OpenAI API response
  https.request = (options, callback) => {
    const fakeResponse = new require('stream').Readable();
    fakeResponse._read = () => {};
    // Simulate successful JSON response
    process.nextTick(() => {
      const responseBody = JSON.stringify({
        choices: [
          {
            message: { content: 'Test response' }
          }
        ]
      });
      fakeResponse.emit('data', responseBody);
      fakeResponse.emit('end');
    });
    callback({
      statusCode: 200,
      on: (event, handler) => fakeResponse.on(event, handler)
    });
    return {
      on: () => {},
      write: () => {},
      end: () => {}
    };
  };
  const result = await generateResponse('What is 2+2?');
  assert.strictEqual(result, 'Test response', 'generateResponse should return the mocked response content');
  // Restore original request
  https.request = originalRequest;
}

module.exports = {
  name: 'openaiService tests',
  tests: [testMissingApiKey, testMockRequest]
};