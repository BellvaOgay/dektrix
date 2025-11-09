const mongoose = require('mongoose');
require('dotenv').config();

async function deleteEp5Videos() {
    try {
        console.log('🔍 Connecting to MongoDB...');
        
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || process.env.VITE_MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Import Video model using the same pattern as other scripts
        const Video = mongoose.models.Video || mongoose.model('Video', require('./src/models/Video.ts').VideoSchema);

        console.log('🔍 Searching for Ep5 videos...');
        
        // Find all Ep5 videos (case insensitive search)
        const ep5Videos = await Video.find({
            $or: [
                { title: { $regex: 'Ep5', $options: 'i' } },
                { videoUrl: { $regex: 'Ep5', $options: 'i' } },
                { filename: { $regex: 'Ep5', $options: 'i' } }
            ]
        });

        console.log(`📊 Found ${ep5Videos.length} Ep5-related videos:`);

        if (ep5Videos.length > 0) {
            // Delete all Ep5 videos
            const deleteResult = await Video.deleteMany({
                $or: [
                    { title: { $regex: 'Ep5', $options: 'i' } },
                    { videoUrl: { $regex: 'Ep5', $options: 'i' } },
                    { filename: { $regex: 'Ep5', $options: 'i' } }
                ]
            });

            console.log(`✅ Successfully deleted ${deleteResult.deletedCount} Ep5 videos from database`);
            
            // Log details of deleted videos
            ep5Videos.forEach((video, index) => {
                console.log(`\n📹 Deleted Video ${index + 1}:`);
                console.log(`   Title: ${video.title}`);
                console.log(`   URL: ${video.videoUrl}`);
                console.log(`   ID: ${video._id}`);
                if (video.filename) console.log(`   Filename: ${video.filename}`);
            });
        } else {
            console.log('ℹ️ No Ep5 videos found in database');
        }

    } catch (error) {
        console.error('❌ Error deleting Ep5 videos:', error.message);
    } finally {
        // Close connection
        await mongoose.connection.close();
        console.log('\n✅ Database connection closed');
        console.log('\n🎉 Ep5 deletion process completed!');
    }
}

// Run the function
deleteEp5Videos();