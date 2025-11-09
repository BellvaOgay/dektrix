const https = require('https');

console.log('🧪 Final testing of Ep5 and Ep6 endpoints...\n');

const productionUrl = 'https://dektrix-1k6r54zgp-bellvaogays-projects.vercel.app';

function testEndpoint(endpoint) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'dektrix-1k6r54zgp-bellvaogays-projects.vercel.app',
      path: `/api/videos/${endpoint}`,
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
        try {
          const response = JSON.parse(data);
          resolve({ status: res.statusCode, data: response });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

async function runTests() {
  try {
    console.log('📹 Testing Ep5 endpoint...');
    const ep5Result = await testEndpoint('ep5');
    console.log(`   Status: ${ep5Result.status}`);
    if (ep5Result.status === 200 && ep5Result.data.success) {
      console.log('✅ Ep5 endpoint working!');
      console.log(`   Title: ${ep5Result.data.data.title}`);
      console.log(`   URL: ${ep5Result.data.data.videoUrl}`);
      console.log(`   Price: ${ep5Result.data.data.priceDisplay}`);
    } else {
      console.log('❌ Ep5 endpoint failed');
      console.log(`   Response: ${JSON.stringify(ep5Result.data)}`);
    }

    console.log('');

    console.log('📹 Testing Ep6 endpoint...');
    const ep6Result = await testEndpoint('ep6');
    console.log(`   Status: ${ep6Result.status}`);
    if (ep6Result.status === 200 && ep6Result.data.success) {
      console.log('✅ Ep6 endpoint working!');
      console.log(`   Title: ${ep6Result.data.data.title}`);
      console.log(`   URL: ${ep6Result.data.data.videoUrl}`);
      console.log(`   Price: ${ep6Result.data.data.priceDisplay}`);
    } else {
      console.log('❌ Ep6 endpoint failed');
      console.log(`   Response: ${JSON.stringify(ep6Result.data)}`);
    }

  } catch (error) {
    console.log('❌ Test failed:', error.message);
  }
}

runTests();