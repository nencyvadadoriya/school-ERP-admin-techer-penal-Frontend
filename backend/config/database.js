const mongoose = require('mongoose');
require('dotenv').config();

let uri = process.env.MONGODB_URI;

// Fallback: allow providing creds separately to avoid issues with special characters
if (!uri && process.env.MONGO_USER && process.env.MONGO_PASS && (process.env.MONGO_HOST || process.env.MONGODB_HOST)) {
  const user = encodeURIComponent(process.env.MONGO_USER);
  const pass = encodeURIComponent(process.env.MONGO_PASS);
  const host = process.env.MONGO_HOST || process.env.MONGODB_HOST;
  const dbName = process.env.MONGO_DB || process.env.MONGODB_DB || 'admin';
  uri = `mongodb+srv://${user}:${pass}@${host}/${dbName}?retryWrites=true&w=majority`;
}

let isConnected = false;
const connectDB = async () => {
  if (isConnected) return;
  try {
    const conn = await mongoose.connect(uri);
    isConnected = true;
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.name}`);
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error.message);
    // Don't exit process in serverless
  }
};

// Handle connection events
mongoose.connection.on('connected', () => {
  console.log('✅ Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('⚠️  Mongoose disconnected from MongoDB');
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('MongoDB connection closed due to app termination');
  process.exit(0);
});

module.exports = connectDB;
