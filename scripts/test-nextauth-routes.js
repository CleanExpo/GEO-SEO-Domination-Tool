/**
 * NextAuth Routes Tester
 * Verifies that NextAuth v5 routes are accessible
 */

const http = require('http');

const BASE_URL = 'http://localhost:3000';

const routes = [
  '/api/auth/providers',
  '/api/auth/csrf',
  '/api/auth/signin',
];

console.log('='.repeat(60));
console.log('NextAuth v5 Routes Test');
console.log('='.repeat(60));
console.log('');

async function testRoute(path) {
  return new Promise((resolve) => {
    const url = `${BASE_URL}${path}`;

    http.get(url, (res) => {
      const statusIcon = res.statusCode === 200 ? '✅' : res.statusCode === 302 || res.statusCode === 307 ? '🔄' : '❌';
      console.log(`${statusIcon} ${path}`);
      console.log(`   Status: ${res.statusCode} ${res.statusMessage}`);

      if (res.headers.location) {
        console.log(`   Redirect: ${res.headers.location}`);
      }

      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode === 200 && data) {
          try {
            const json = JSON.parse(data);
            console.log(`   Response: ${JSON.stringify(json, null, 2).substring(0, 200)}...`);
          } catch (e) {
            console.log(`   Response: ${data.substring(0, 100)}...`);
          }
        }
        console.log('');
        resolve({ path, status: res.statusCode, ok: res.statusCode >= 200 && res.statusCode < 400 });
      });
    }).on('error', (err) => {
      console.log(`❌ ${path}`);
      console.log(`   Error: ${err.message}`);
      console.log('');
      resolve({ path, status: 0, ok: false });
    });
  });
}

async function runTests() {
  console.log('Testing NextAuth routes...');
  console.log('');

  const results = [];
  for (const route of routes) {
    const result = await testRoute(route);
    results.push(result);
  }

  console.log('='.repeat(60));
  console.log('Test Summary');
  console.log('='.repeat(60));
  console.log('');

  const passed = results.filter(r => r.ok).length;
  const total = results.length;

  if (passed === total) {
    console.log(`✅ All ${total} routes are accessible`);
  } else {
    console.log(`❌ ${total - passed} out of ${total} routes failed`);
  }

  console.log('');
  console.log('Next steps:');
  console.log('1. Open http://localhost:3000/auth/signin in your browser');
  console.log('2. Click "Continue with Google"');
  console.log('3. Check server logs for debug output');
  console.log('');
}

// Check if server is running
http.get(BASE_URL, (res) => {
  console.log(`✅ Dev server is running on ${BASE_URL}`);
  console.log('');
  runTests();
}).on('error', (err) => {
  console.log(`❌ Dev server is not running on ${BASE_URL}`);
  console.log('   Please start it with: npm run dev');
  console.log('');
  process.exit(1);
});
