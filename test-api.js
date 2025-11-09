import https from 'https';

const url = 'https://dektrix-5zscc5l29-bellvaogays-projects.vercel.app/api/videos';

console.log('Testing API endpoint:', url);

const req = https.get(url, (res) => {
  console.log('Status Code:', res.statusCode);
  console.log('Headers:', res.headers);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      const jsonData = JSON.parse(data);
      console.log('Response:', JSON.stringify(jsonData, null, 2));
      if (jsonData.success && jsonData.data) {
        console.log('Number of videos:', jsonData.data.length);
        jsonData.data.forEach((video, index) => {
          console.log(`Video ${index + 1}: ${video.title} (ID: ${video._id})`);
        });
      }
    } catch (err) {
      console.log('Raw response:', data);
      console.error('Error parsing JSON:', err.message);
    }
  });
});

req.on('error', (err) => {
  console.error('Request error:', err.message);
});

req.end();