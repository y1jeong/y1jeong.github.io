require('dotenv').config({ path: '../src/backend/.env' });
const mongoose = require('mongoose');
const User = require('../src/backend/src/models/User').User;

async function listUsers() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/design-studio');
    console.log('Connected to MongoDB');
    
    // Find all users
    const users = await User.find({}).select('_id email firstName lastName role isActive isVerified createdAt');
    
    if (users.length === 0) {
      console.log('No users found in the database');
      return;
    }
    
    console.log('\n=== EXISTING USER ACCOUNTS ===\n');
    console.log('Note: Passwords are securely hashed and cannot be viewed for security reasons.\n');
    
    users.forEach((user, index) => {
      console.log(`${index + 1}. User ID: ${user._id}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Name: ${user.firstName} ${user.lastName}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Status: ${user.isActive ? 'Active' : 'Inactive'} | ${user.isVerified ? 'Verified' : 'Unverified'}`);
      console.log(`   Created: ${user.createdAt.toLocaleDateString()}`);
      console.log(`   Password: [SECURELY HASHED - Cannot be viewed]`);
      console.log('   ---');
    });
    
    console.log(`\nTotal users: ${users.length}`);
    console.log('\nTo log in, use the email address and the password that was set during registration.');
    
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

listUsers();