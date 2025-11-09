const mongoose = require('mongoose');
require('dotenv').config();

async function verifyEp5Removed() {
    try {
        console.log('🔍 Verifying Ep5 has been completely removed...\n');
        
        // Connect to MongoDB
        console.log('📊 Checking database...');
        await mongoose.connect(process.env.MONGODB_URI || process.env.VITE_MONGODB_URI);
        
        // Import Video model
        const Video = mongoose.models.Video || mongoose.model('Video', require('./src/models/Video.ts').VideoSchema);

        // Check if any Ep5 videos exist in database
        const ep5Videos = await Video.find({
            $or: [
                { title: { $regex: 'Ep5', $options: 'i' } },
                { videoUrl: { $regex: 'Ep5', $options: 'i' } },
                { filename: { $regex: 'Ep5', $options: 'i' } }
            ]
        });

        console.log(`📊 Ep5 videos in database: ${ep5Videos.length}`);
        
        if (ep5Videos.length === 0) {
            console.log('✅ SUCCESS: No Ep5 videos found in database');
        } else {
            console.log('❌ FAILURE: Ep5 videos still exist in database:');
            ep5Videos.forEach(video => {
                console.log(`   - ${video.title} (${video._id})`);
            });
        }

        // Check file system
        console.log('\n📁 Checking file system...');
        const fs = require('fs');
        const path = require('path');
        
        const videosDir = path.join(__dirname, 'public', 'videos');
        const files = fs.readdirSync(videosDir);
        const ep5Files = files.filter(file => file.toLowerCase().includes('ep5'));
        
        console.log(`📊 Ep5 files in public/videos: ${ep5Files.length}`);
        
        if (ep5Files.length === 0) {
            console.log('✅ SUCCESS: No Ep5 video files found');
        } else {
            console.log('❌ FAILURE: Ep5 video files still exist:');
            ep5Files.forEach(file => {
                console.log(`   - ${file}`);
            });
        }

        // Check if Ep5 API endpoint files exist
        console.log('\n🌐 Checking API endpoints...');
        const apiFiles = [
            'api/videos/ep5.ts',
            'test-ep5-visibility.js',
            'test-ep5-availability.cjs', 
            'test-ep5-endpoint.mjs',
            'check-ep5-in-db.js',
            'add-ep5-to-database.cjs'
        ];

        let ep5ApiFilesExist = 0;
        apiFiles.forEach(file => {
            if (fs.existsSync(path.join(__dirname, file))) {
                console.log(`❌ FAILURE: Ep5 API file still exists: ${file}`);
                ep5ApiFilesExist++;
            }
        });

        if (ep5ApiFilesExist === 0) {
            console.log('✅ SUCCESS: All Ep5 API endpoint files have been removed');
        }

        console.log('\n🎯 FINAL VERIFICATION SUMMARY:');
        console.log(`   Database: ${ep5Videos.length === 0 ? '✅ CLEAN' : '❌ DIRTY'}`);
        console.log(`   Filesystem: ${ep5Files.length === 0 ? '✅ CLEAN' : '❌ DIRTY'}`);
        console.log(`   API Endpoints: ${ep5ApiFilesExist === 0 ? '✅ CLEAN' : '❌ DIRTY'}`);
        
        if (ep5Videos.length === 0 && ep5Files.length === 0 && ep5ApiFilesExist === 0) {
            console.log('\n🎉 SUCCESS: Ep5 has been completely removed from the system!');
        } else {
            console.log('\n⚠️  WARNING: Ep5 removal is incomplete. Please check the above issues.');
        }

    } catch (error) {
        console.error('❌ Error during verification:', error.message);
    } finally {
        // Close connection
        await mongoose.connection.close();
        console.log('\n✅ Database connection closed');
    }
}

// Run the verification
verifyEp5Removed();