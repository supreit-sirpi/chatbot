import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongod: MongoMemoryServer | null = null;

export const connectDB = async (): Promise<void> => {
  try {
    let dbUrl = process.env.MONGODB_URI;

    if (!dbUrl) {
      console.log('No MONGODB_URI found in env. Spinning up an in-memory MongoDB server...');
      mongod = await MongoMemoryServer.create();
      dbUrl = mongod.getUri();
      console.log(`In-memory MongoDB started at: ${dbUrl}`);
    }

    await mongoose.connect(dbUrl);
    console.log('MongoDB Connected Successfully.');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    process.exit(1);
  }
};

export const closeDB = async (): Promise<void> => {
  try {
    await mongoose.connection.close();
    if (mongod) {
      await mongod.stop();
      console.log('In-memory MongoDB stopped.');
    }
  } catch (error) {
    console.error('Error closing database connections:', error);
  }
};
