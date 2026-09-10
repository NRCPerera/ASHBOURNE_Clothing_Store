const mongoose = require('mongoose');

/**
 * Connect to MongoDB.
 * Exits the process on connection failure — there's nothing useful
 * the server can do without a database.
 */
const connectDB = async (uri) => {
  try {
    const conn = await mongoose.connect(uri);
    console.log(`✅  MongoDB connected: ${conn.connection.host}`);
  } catch (err) {
    console.error(`❌  MongoDB connection error: ${err.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
