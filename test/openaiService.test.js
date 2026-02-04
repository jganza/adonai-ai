// Test file for the OpenAI service
const { askOpenAI } = require('../backend/openaiService');

async function testMissingApiKey() {
  // Ensure the API key is not set
  delete process.env.OPENAI_API_KEY;
  let passed = false;
  try {
    await askOpenAI('Hello');
    console.error('FAIL: Expected askOpenAI to reject when API key is missing');
  } catch (err) {
    passed = true;
    console.log('PASS: askOpenAI rejected when API key is missing');
  }
  return passed;
}

async function runTests() {
  const results = [];
  results.push(await testMissingApiKey());
  // Additional tests could be added here by pushing their results to the array
  const allPassed = results.every(Boolean);
  if (allPassed) {
    console.log('All tests passed');
  } else {
    console.error('Some tests failed');
    process.exitCode = 1;
  }
}

runTests().catch((err) => {
  console.error('Unhandled error during tests:', err);
  process.exitCode = 1;
});
