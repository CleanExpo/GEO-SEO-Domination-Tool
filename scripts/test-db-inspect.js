const https = require('https');

const options = {
  hostname: 'geo-seo-domination-tool.vercel.app',
  port: 443,
  path: '/api/test-db-methods',
  method: 'GET',
  headers: {
    'User-Agent': 'Node.js Test Script'
  }
};

const req = https.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Response:');
    try {
      const json = JSON.parse(data);
      console.log(JSON.stringify(json, null, 2));
    } catch (e) {
      console.log(data);
    }
  });
});

req.on('error', (error) => {
  console.error('Error:', error.message);
});

req.end();
