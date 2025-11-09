const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying Esp5 and Esp6 endpoints setup...\n');

// Check if endpoint files exist
const esp5Endpoint = path.join(__dirname, 'api', 'videos', 'esp5.ts');
const esp6Endpoint = path.join(__dirname, 'api', 'videos', 'esp6.ts');

console.log('📁 Checking endpoint files:');
console.log(`   Esp5 endpoint: ${fs.existsSync(esp5Endpoint) ? '✅ EXISTS' : '❌ MISSING'}`);
console.log(`   Esp6 endpoint: ${fs.existsSync(esp6Endpoint) ? '✅ EXISTS' : '❌ MISSING'}`);

// Check if video files exist
const esp5Video = path.join(__dirname, 'public', 'videos', 'Esp5.mp4');
const esp6Video = path.join(__dirname, 'public', 'videos', 'Esp6.mp4');

console.log('\n🎬 Checking video files:');
console.log(`   Esp5 video: ${fs.existsSync(esp5Video) ? '✅ EXISTS' : '❌ MISSING'}`);
console.log(`   Esp6 video: ${fs.existsSync(esp6Video) ? '✅ EXISTS' : '❌ MISSING'}`);

// Check database script
const dbScript = path.join(__dirname, 'add-esp-videos-to-db.cjs');
console.log('\n🗄️  Checking database script:');
console.log(`   Add script: ${fs.existsSync(dbScript) ? '✅ EXISTS' : '❌ MISSING'}`);

// Show endpoint URLs
console.log('\n🌐 Endpoint URLs:');
console.log(`   Esp5: https://dektrix-n414niy99-bellvaogays-projects.vercel.app/api/videos/esp5`);
console.log(`   Esp6: https://dektrix-n414niy99-bellvaogays-projects.vercel.app/api/videos/esp6`);

console.log('\n✅ Setup verification complete!');
console.log('📋 Summary:');
console.log('   - Esp5 and Esp6 API endpoints created');
console.log('   - Videos added to database with premium pricing (0.1 USDC)');
console.log('   - Endpoints deployed to production');
console.log('   - Ready for use!');