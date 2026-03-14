import mongoose from 'mongoose';

const connectDB = async (): Promise<void> => {
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      throw new Error('MONGODB_URI is not set in .env');
    }
    const conn = await mongoose.connect(uri);
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('MongoDB connection error:', message);
    if (message.includes('bad auth')) {
      console.error('Tip: Check your Atlas username/password and that the user has read/write access.');
    }
    process.exit(1);
  }
};

export default connectDB;
