// Simple test runner that loads all *.test.js files in the current directory
const fs = require('fs');
const path = require('path');

(async () => {
  const testDir = __dirname;
  const files = fs.readdirSync(testDir).filter(f => f.endsWith('.test.js'));
  for (const file of files) {
    console.log(`\n=== Running ${file} ===`);
    try {
      require(path.join(testDir, file));
    } catch (err) {
      console.error(`Error running ${file}:`, err);
      process.exitCode = 1;
    }
  }
})();
