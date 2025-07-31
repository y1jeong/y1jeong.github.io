const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8000;

// CORS configuration
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Mock user data
const mockUsers = [
  {
    _id: '1',
    email: 'admin@example.com',
    firstName: 'Admin',
    lastName: 'User',
    role: 'admin',
    isActive: true,
    isVerified: true,
    lastLogin: new Date().toISOString(),
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: new Date().toISOString()
  },
  {
    _id: '2',
    email: 'user1@example.com',
    firstName: 'John',
    lastName: 'Doe',
    role: 'user',
    isActive: true,
    isVerified: true,
    lastLogin: '2024-01-15T10:30:00.000Z',
    createdAt: '2024-01-10T00:00:00.000Z',
    updatedAt: '2024-01-15T10:30:00.000Z'
  },
  {
    _id: '3',
    email: 'user2@example.com',
    firstName: 'Jane',
    lastName: 'Smith',
    role: 'user',
    isActive: true,
    isVerified: false,
    lastLogin: null,
    createdAt: '2024-01-12T00:00:00.000Z',
    updatedAt: '2024-01-12T00:00:00.000Z'
  },
  {
    _id: '4',
    email: 'inactive@example.com',
    firstName: 'Inactive',
    lastName: 'User',
    role: 'user',
    isActive: false,
    isVerified: true,
    lastLogin: '2024-01-05T08:00:00.000Z',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-05T08:00:00.000Z'
  }
];

// Mock statistics
const mockStatistics = {
  total: mockUsers.length,
  active: mockUsers.filter(u => u.isActive).length,
  verified: mockUsers.filter(u => u.isVerified).length,
  admins: mockUsers.filter(u => u.role === 'admin').length,
  recentSignups: mockUsers.filter(u => {
    const createdDate = new Date(u.createdAt);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return createdDate > weekAgo;
  }).length
};

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Auth endpoints
app.post('/api/auth/login', (req, res) => {
  console.log('Login attempt:', req.body);
  
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Missing email or password'
    });
  }
  
  // Find user by email
  const user = mockUsers.find(u => u.email === email);
  
  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials'
    });
  }
  
  // Mock successful login
  res.json({
    success: true,
    data: {
      user: {
        _id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isActive: user.isActive,
        isVerified: user.isVerified
      },
      token: 'mock-jwt-token',
      refreshToken: 'mock-refresh-token'
    }
  });
});

// Admin endpoint to get all users
app.get('/api/auth/admin/users', (req, res) => {
  console.log('Admin users request');
  
  // In a real app, you'd verify the JWT token here
  // For now, just return the mock data
  
  res.json({
    success: true,
    data: {
      users: mockUsers,
      statistics: mockStatistics
    }
  });
});

// Admin endpoint to promote user
app.post('/api/auth/admin/users/:id/promote', (req, res) => {
  const userId = req.params.id;
  const user = mockUsers.find(u => u._id === userId);
  
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }
  
  user.role = 'admin';
  user.updatedAt = new Date().toISOString();
  
  res.json({
    success: true,
    data: { user }
  });
});

// Admin endpoint to demote user
app.post('/api/auth/admin/users/:id/demote', (req, res) => {
  const userId = req.params.id;
  const user = mockUsers.find(u => u._id === userId);
  
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }
  
  user.role = 'user';
  user.updatedAt = new Date().toISOString();
  
  res.json({
    success: true,
    data: { user }
  });
});

// Catch-all route
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 API base URL: http://localhost:${PORT}/api`);
  console.log(`👥 Admin endpoint: http://localhost:${PORT}/api/auth/admin/users`);
  console.log('\n📋 Mock Users:');
  mockUsers.forEach(user => {
    console.log(`  - ${user.email} (${user.role}) - ID: ${user._id}`);
  });
});

module.exports = app;