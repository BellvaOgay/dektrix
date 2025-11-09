// Simple script to check if server is running
const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/api/video-unlock',
  method: 'GET'
};

const req = http.request(options, (res) => {
  console.log(`Server responded with status: ${res.statusCode}`);
  if (res.statusCode === 405) {
    console.log('✅ Server is running! (Method Not Allowed is expected for GET on POST endpoint)');
  } else {
    console.log('Server response:', res.statusCode);
  }
});

req.on('error', (error) => {
  console.log('❌ Server is not running or not accessible');
  console.log('Error:', error.message);
});

req.end();