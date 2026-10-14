const mongoose = require('mongoose');

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/resqfood';

  try {
    // Attempt standard connection (Atlas or Local MongoDB)
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 3000, // Quick fail if local mongo is not running
    });
    console.log(`✅ MongoDB Connected to: ${mongoose.connection.host}`);
  } catch (error) {
    console.warn(`⚠️ Could not connect to MongoDB at ${uri}: ${error.message}`);
    console.log('🔄 Attempting in-memory MongoDB fallback for instant local demo...');

    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      const mongod = await MongoMemoryServer.create();
      const memoryUri = mongod.getUri();
      await mongoose.connect(memoryUri);
      console.log(`✅ In-Memory MongoDB Started & Connected at: ${memoryUri}`);
      console.log('💡 Note: Data will be kept in-memory during this server session.');
    } catch (fallbackError) {
      console.error('❌ Failed to start in-memory MongoDB:', fallbackError.message);
      console.error('👉 Please ensure MongoDB is running locally, or configure MONGODB_URI with MongoDB Atlas in .env');
      process.exit(1);
    }
  }
};

module.exports = connectDB;
