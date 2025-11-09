const http = require('http');

console.log('Checking if server is running on port 3001...');

const req = http.request({
  hostname: 'localhost',
  port: 3001,
  path: '/api/video-unlock',
  method: 'GET',
  timeout: 3000
}, (res) => {
  console.log(`Server responded with status: ${res.statusCode}`);
  process.exit(0);
});

req.on('error', (err) => {
  console.log('Server not running or not responding:', err.message);
  process.exit(1);
});

req.on('timeout', () => {
  console.log('Server connection timeout - server may not be running');
  req.destroy();
  process.exit(1);
});

req.end();