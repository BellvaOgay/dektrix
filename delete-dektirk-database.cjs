const { MongoClient } = require('mongodb');
require('dotenv').config();

async function deleteDektirkDatabase() {
  try {
    // Connect to MongoDB
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      throw new Error('MONGODB_URI not found in environment variables');
    }

    const client = new MongoClient(uri);
    await client.connect();
    console.log('Connected to MongoDB');

    // Get the admin database
    const adminDb = client.db('admin');
    
    // List all databases
    const databases = await adminDb.admin().listDatabases();
    console.log('Available databases:');
    databases.databases.forEach(db => {
      console.log(`- ${db.name}: ${db.sizeOnDisk} bytes`);
    });

    // Check if dektirk exists
    const dektirkExists = databases.databases.some(db => db.name === 'dektirk');
    
    if (!dektirkExists) {
      console.log('❌ dektirk database does not exist');
      await client.close();
      return;
    }

    console.log('\n🗑️  Preparing to delete dektirk database...');
    
    // Show what's in dektirk before deletion
    const dektirkDb = client.db('dektirk');
    const collections = await dektirkDb.listCollections().toArray();
    console.log(`Found ${collections.length} collections in dektirk:`);
    
    for (const collection of collections) {
      const count = await dektirkDb.collection(collection.name).countDocuments();
      console.log(`- ${collection.name}: ${count} documents`);
    }

    // Confirm deletion
    console.log('\n⚠️  WARNING: This will permanently delete the dektirk database!');
    console.log('This action cannot be undone.');
    
    // Delete the database by dropping all collections
    for (const collection of collections) {
      await dektirkDb.collection(collection.name).drop();
      console.log(`✅ Dropped collection: ${collection.name}`);
    }
    
    console.log('✅ dektirk database has been deleted');
    
    // Verify dektrix still exists
    const dektrixDb = client.db('dektrix');
    const dektrixCollections = await dektrixDb.listCollections().toArray();
    console.log(`\n✅ dektrix database still exists with ${dektrixCollections.length} collections`);
    
    // Count videos in dektrix
    const videosCount = await dektrixDb.collection('videos').countDocuments();
    console.log(`✅ dektrix contains ${videosCount} videos`);

    await client.close();
    console.log('\n🎉 Database cleanup completed successfully!');
    
  } catch (error) {
    console.error('❌ Error deleting database:', error);
    process.exit(1);
  }
}

// Run the script
deleteDektirkDatabase();