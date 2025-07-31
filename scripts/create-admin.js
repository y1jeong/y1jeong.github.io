/**
 * Script to create the first admin user
 * Run this script after registering your first user to promote them to admin
 * 
 * Usage: node scripts/create-admin.js <email>
 * Example: node scripts/create-admin.js admin@example.com
 */

const mongoose = require('mongoose');
require('dotenv').config();

// User schema (simplified version)
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true, select: false },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  isEmailVerified: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

async function createAdmin() {
  const email = process.argv[2];
  
  if (!email) {
    console.error('Please provide an email address');
    console.error('Usage: node scripts/create-admin.js <email>');
    process.exit(1);
  }
  
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/design-studio');
    console.log('Connected to MongoDB');
    
    // Find user by email
    const user = await User.findOne({ email });
    
    if (!user) {
      console.error(`User with email ${email} not found`);
      console.error('Please register this user first through the application');
      process.exit(1);
    }
    
    if (user.role === 'admin') {
      console.log(`User ${email} is already an admin`);
      process.exit(0);
    }
    
    // Promote to admin
    user.role = 'admin';
    await user.save();
    
    console.log(`✅ Successfully promoted ${email} to admin`);
    console.log('You can now log in and access the admin panel at /admin');
    
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

createAdmin();