/**
 * Seed script: creates the first admin user.
 * Usage:  node src/scripts/seedAdmin.js
 */
const mongoose = require('mongoose');
const env = require('../config/env');
const User = require('../models/User');

const seedAdmin = async () => {
  try {
    await mongoose.connect(env.MONGO_URI);
    console.log('Connected to MongoDB');

    const existing = await User.findOne({ role: 'admin' });
    if (existing) {
      console.log(`Admin already exists: ${existing.email}`);
      process.exit(0);
    }

    const admin = await User.create({
      name: 'Admin',
      email: 'admin@ashbourne.lk',
      password: 'Admin@1234',
      role: 'admin',
    });

    console.log(`✅  Admin user created:`);
    console.log(`    Email:    ${admin.email}`);
    console.log(`    Password: Admin@1234`);
    console.log(`    ⚠️  Change this password immediately!`);

    process.exit(0);
  } catch (err) {
    console.error('❌  Seed failed:', err.message);
    process.exit(1);
  }
};

seedAdmin();
