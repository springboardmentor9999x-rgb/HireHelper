const http = require('http');

// Test the API endpoint without token
const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/tasks/my',
  method: 'GET',
  headers: {
    'Authorization': 'Bearer invalid_token'
  }
};

console.log('🧪 Testing API endpoint: GET /api/tasks/my\n');

const req = http.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log(`Status: ${res.statusCode}\n`);
    console.log('Response:');
    try {
      const json = JSON.parse(data);
      console.log(JSON.stringify(json, null, 2));
    } catch (e) {
      console.log(data);
    }
  });
});

req.on('error', (e) => {
  console.error(`❌ Request failed: ${e.message}`);
});

req.end();
