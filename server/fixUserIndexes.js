const { MongoClient } = require('mongodb');

const uri = 'mongodb+srv://sajidmehmood:3V4PyBh3h4SFnw%40@cluster0.yhma3.mongodb.net/pgc';
const dbName = 'pgc';

async function main() {
  const client = new MongoClient(uri, { useUnifiedTopology: true });

  try {
    await client.connect();
    const db = client.db(dbName);
    const users = db.collection('users');

    // 1. List all indexes
    const indexes = await users.indexes();
    console.log('Current indexes:', indexes);

    // 2. Drop the incorrect index if it exists
    const usernameIndex = indexes.find(idx => idx.key && idx.key.username === 1);
    if (usernameIndex) {
      await users.dropIndex('username_1');
      console.log('Dropped index: username_1');
    } else {
      console.log('No index named username_1 found.');
    }

    // 3. Create unique index on userName
    await users.createIndex({ userName: 1 }, { unique: true });
    console.log('Created unique index on userName');

    // 4. Delete users with userName: null
    const deleteResult = await users.deleteMany({ userName: null });
    console.log(`Deleted ${deleteResult.deletedCount} users with userName: null`);

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.close();
  }
}

main(); 