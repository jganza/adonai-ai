/*
 * A tiny test runner for the Adonai.ai monorepo.
 *
 * This script discovers test modules in the current directory and executes
 * their exported test functions sequentially. It collects the results and
 * prints a summary at the end. Use `npm run test` to execute this file.
 */

const fs = require('fs');
const path = require('path');

async function run() {
  const testDir = __dirname;
  const files = fs.readdirSync(testDir).filter((f) => f.endsWith('.test.js'));
  let passed = 0;
  let failed = 0;
  for (const file of files) {
    const testModule = require(path.join(testDir, file));
    const tests = testModule.tests || [];
    console.log(`Running ${testModule.name || file}...`);
    for (const testFn of tests) {
      const testName = testFn.name;
      try {
        await testFn();
        passed += 1;
        console.log(` ✔ ${testName}`);
      } catch (err) {
        failed += 1;
        console.error(` ✖ ${testName} failed:`, err.message);
      }
    }
  }
  console.log(`\nTest summary: ${passed} passed, ${failed} failed`);
  if (failed > 0) {
    process.exitCode = 1;
  }
}

run().catch((err) => {
  console.error('Error running tests', err);
  process.exitCode = 1;
});