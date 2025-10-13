/**
 * Kill Process on Port 3000
 *
 * Frees up port 3000 by killing any process using it
 *
 * Usage:
 *   node scripts/kill-port-3000.js
 */

const { execSync } = require('child_process');

const PORT = 3000;

console.log(`🔍 Checking for process on port ${PORT}...`);

try {
  // Windows: Find process using port
  const command = process.platform === 'win32'
    ? `netstat -ano | findstr :${PORT}`
    : `lsof -ti:${PORT}`;

  const output = execSync(command, { encoding: 'utf8' });

  if (output) {
    console.log(`📋 Found process using port ${PORT}`);

    if (process.platform === 'win32') {
      // Windows: Extract PID and kill
      const lines = output.trim().split('\n');
      const pids = new Set();

      lines.forEach((line) => {
        const match = line.trim().match(/\s+(\d+)$/);
        if (match) {
          pids.add(match[1]);
        }
      });

      if (pids.size > 0) {
        pids.forEach((pid) => {
          try {
            console.log(`🔪 Killing process ${pid}...`);
            execSync(`taskkill /PID ${pid} /F`, { stdio: 'inherit' });
            console.log(`✅ Process ${pid} killed`);
          } catch (error) {
            console.log(`⚠️  Could not kill process ${pid}`);
          }
        });
      }
    } else {
      // Unix/Mac: Kill directly
      const pids = output.trim().split('\n');
      pids.forEach((pid) => {
        if (pid) {
          try {
            console.log(`🔪 Killing process ${pid}...`);
            execSync(`kill -9 ${pid}`, { stdio: 'inherit' });
            console.log(`✅ Process ${pid} killed`);
          } catch (error) {
            console.log(`⚠️  Could not kill process ${pid}`);
          }
        }
      });
    }

    console.log(`\n✅ Port ${PORT} is now free!`);
  } else {
    console.log(`✅ Port ${PORT} is already free`);
  }
} catch (error) {
  // No process found (command returns error if port is free)
  console.log(`✅ Port ${PORT} is already free`);
}

console.log('\n💡 You can now start the dev server:');
console.log('   npm run dev');
