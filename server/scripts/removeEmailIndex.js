const mongoose = require('mongoose');
require('dotenv').config();

async function removeEmailIndex() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Get the User collection
    const db = mongoose.connection.db;
    const collection = db.collection('users');

    // Check existing indexes
    const indexes = await collection.indexes();
    console.log('Current indexes:', indexes.map(idx => ({ name: idx.name, key: idx.key })));

    // Drop the email index if it exists
    try {
      await collection.dropIndex('email_1');
      console.log('Successfully dropped email index');
    } catch (error) {
      if (error.message.includes('index not found')) {
        console.log('Email index does not exist - no action needed');
      } else {
        console.error('Error dropping email index:', error.message);
      }
    }

    // Check indexes after dropping
    const indexesAfter = await collection.indexes();
    console.log('Indexes after operation:', indexesAfter.map(idx => ({ name: idx.name, key: idx.key })));

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the script
removeEmailIndex();
