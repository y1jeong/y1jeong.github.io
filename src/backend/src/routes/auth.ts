import express, { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { User, IUser } from '@/models/User';
import { Session } from '@/models/Session';
import { authenticate, optionalAuth, requireAdmin } from '@/middleware/auth';
import { asyncHandler } from '@/middleware/errorHandler';
import { AppError, ValidationError, AuthenticationError } from '@/middleware/errorHandler';
import { logger } from '@/utils/logger';
import { body, validationResult } from 'express-validator';
import rateLimit from 'express-rate-limit';

const router = express.Router();

// Rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: {
    error: 'Too many authentication attempts, please try again later',
    retryAfter: 15 * 60 // seconds
  },
  standardHeaders: true,
  legacyHeaders: false
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 registrations per hour per IP
  message: {
    error: 'Too many registration attempts, please try again later',
    retryAfter: 60 * 60
  }
});

// Validation rules
const registerValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  body('firstName')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('First name must be between 1 and 50 characters'),
  body('lastName')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Last name must be between 1 and 50 characters')
];

const loginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

const forgotPasswordValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address')
];

const resetPasswordValidation = [
  body('token')
    .notEmpty()
    .withMessage('Reset token is required'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character')
];

// Helper function to generate JWT tokens
const generateTokens = (userId: string) => {
  const accessToken = jwt.sign(
    { userId, type: 'access' },
    process.env['JWT_SECRET']!,
      { expiresIn: process.env['JWT_EXPIRES_IN'] || '15m' }
  );
  
  const refreshToken = jwt.sign(
    { userId, type: 'refresh' },
    process.env['JWT_REFRESH_SECRET']!,
      { expiresIn: process.env['JWT_REFRESH_EXPIRES_IN'] || '7d' }
  );
  
  return { accessToken, refreshToken };
};

// Helper function to set auth cookies
const setAuthCookies = (res: Response, accessToken: string, refreshToken: string) => {
  const isProduction = process.env['NODE_ENV'] === 'production';
  
  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'strict' : 'lax',
    maxAge: 15 * 60 * 1000 // 15 minutes
  });
  
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'strict' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });
};

// Helper function to clear auth cookies
const clearAuthCookies = (res: Response) => {
  res.clearCookie('accessToken');
  res.clearCookie('refreshToken');
};

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', registerLimiter, registerValidation, asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError('Validation failed', errors.array());
  }
  
  const { email, password, firstName, lastName } = req.body;
  
  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new ValidationError('User with this email already exists');
  }
  
  // Create new user
  const user = new User({
    email,
    password,
    firstName,
    lastName
  });
  
  await user.save();
  
  // Generate email verification token
  const verificationToken = user.generateEmailVerificationToken();
  await user.save();
  
  // TODO: Send verification email
  // await sendVerificationEmail(user.email, verificationToken);
  
  logger.info('New user registered', { 
    userId: user._id, 
    email: user.email,
    ip: req.ip 
  });
  
  res.status(201).json({
    success: true,
    message: 'User registered successfully. Please check your email for verification.',
    data: {
      user: user.getPublicProfile()
    }
  });
}));

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post('/login', authLimiter, loginValidation, asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError('Validation failed', errors.array());
  }
  
  const { email, password } = req.body;
  
  // Find user and include password for comparison
  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    throw new AuthenticationError('Invalid email or password');
  }
  
  // Check if account is locked
  if (user.isLocked()) {
    throw new AuthenticationError('Account is temporarily locked due to too many failed login attempts');
  }
  
  // Check if account is active
  if (!user.isActive) {
    throw new AuthenticationError('Account is deactivated');
  }
  
  // Verify password
  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    await user.incrementLoginAttempts();
    throw new AuthenticationError('Invalid email or password');
  }
  
  // Reset login attempts on successful login
  if (user.loginAttempts > 0) {
    await user.resetLoginAttempts();
  }
  
  // Update last login
  user.lastLogin = new Date();
  await user.save();
  
  // Generate tokens
  const { accessToken, refreshToken } = generateTokens(user._id.toString());
  
  // Set auth cookies
  setAuthCookies(res, accessToken, refreshToken);
  
  logger.info('User logged in', { 
    userId: user._id, 
    email: user.email,
    ip: req.ip 
  });
  
  res.json({
    success: true,
    message: 'Login successful',
    data: {
      user: user.getPublicProfile(),
      accessToken,
      refreshToken
    }
  });
}));

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user
 * @access  Private
 */
router.post('/logout', authenticate, asyncHandler(async (req: Request, res: Response) => {
  // Clear auth cookies
  clearAuthCookies(res);
  
  logger.info('User logged out', { 
    userId: req.user?.id,
    ip: req.ip 
  });
  
  res.json({
    success: true,
    message: 'Logout successful'
  });
}));

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh access token
 * @access  Public
 */
router.post('/refresh', asyncHandler(async (req: Request, res: Response) => {
  const refreshToken = req.cookies.refreshToken || req.body.refreshToken;
  
  if (!refreshToken) {
    throw new AuthenticationError('Refresh token not provided');
  }
  
  try {
    const decoded = jwt.verify(refreshToken, process.env['JWT_REFRESH_SECRET']!) as any;
    
    if (decoded.type !== 'refresh') {
      throw new AuthenticationError('Invalid token type');
    }
    
    // Find user
    const user = await User.findById(decoded.userId);
    if (!user || !user.isActive) {
      throw new AuthenticationError('User not found or inactive');
    }
    
    // Generate new tokens
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user._id.toString());
    
    // Set new auth cookies
    setAuthCookies(res, accessToken, newRefreshToken);
    
    logger.debug('Tokens refreshed', { userId: user._id });
    
    res.json({
      success: true,
      message: 'Tokens refreshed successfully',
      data: {
        accessToken,
        refreshToken: newRefreshToken
      }
    });
  } catch (error) {
    clearAuthCookies(res);
    throw new AuthenticationError('Invalid or expired refresh token');
  }
}));

/**
 * @route   GET /api/auth/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/me', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findById(req.user!.id);
  if (!user) {
    throw new AuthenticationError('User not found');
  }
  
  res.json({
    success: true,
    data: {
      user: user.getPublicProfile()
    }
  });
}));

/**
 * @route   PUT /api/auth/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put('/profile', authenticate, [
  body('firstName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('First name must be between 1 and 50 characters'),
  body('lastName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Last name must be between 1 and 50 characters'),
  body('preferences')
    .optional()
    .isObject()
    .withMessage('Preferences must be an object')
], asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError('Validation failed', errors.array());
  }
  
  const user = await User.findById(req.user!.id);
  if (!user) {
    throw new AuthenticationError('User not found');
  }
  
  const { firstName, lastName, preferences } = req.body;
  
  if (firstName !== undefined) user.firstName = firstName;
  if (lastName !== undefined) user.lastName = lastName;
  if (preferences !== undefined) {
    user.preferences = { ...user.preferences, ...preferences };
  }
  
  await user.save();
  
  logger.info('User profile updated', { userId: user._id });
  
  res.json({
    success: true,
    message: 'Profile updated successfully',
    data: {
      user: user.getPublicProfile()
    }
  });
}));

/**
 * @route   POST /api/auth/change-password
 * @desc    Change user password
 * @access  Private
 */
router.post('/change-password', authenticate, [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character')
], asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError('Validation failed', errors.array());
  }
  
  const { currentPassword, newPassword } = req.body;
  
  const user = await User.findById(req.user!.id).select('+password');
  if (!user) {
    throw new AuthenticationError('User not found');
  }
  
  // Verify current password
  const isCurrentPasswordValid = await user.comparePassword(currentPassword);
  if (!isCurrentPasswordValid) {
    throw new AuthenticationError('Current password is incorrect');
  }
  
  // Update password
  user.password = newPassword;
  await user.save();
  
  logger.info('User password changed', { userId: user._id });
  
  res.json({
    success: true,
    message: 'Password changed successfully'
  });
}));

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Send password reset email
 * @access  Public
 */
router.post('/forgot-password', authLimiter, forgotPasswordValidation, asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError('Validation failed', errors.array());
  }
  
  const { email } = req.body;
  
  const user = await User.findOne({ email });
  if (!user) {
    // Don't reveal if user exists or not
    return res.json({
      success: true,
      message: 'If an account with that email exists, a password reset link has been sent.'
    });
  }
  
  // Generate password reset token
  const resetToken = user.generatePasswordResetToken();
  await user.save();
  
  // TODO: Send password reset email
  // await sendPasswordResetEmail(user.email, resetToken);
  
  logger.info('Password reset requested', { 
    userId: user._id, 
    email: user.email,
    ip: req.ip 
  });
  
  res.json({
    success: true,
    message: 'If an account with that email exists, a password reset link has been sent.'
  });
}));

/**
 * @route   POST /api/auth/reset-password
 * @desc    Reset password with token
 * @access  Public
 */
router.post('/reset-password', authLimiter, resetPasswordValidation, asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError('Validation failed', errors.array());
  }
  
  const { token, password } = req.body;
  
  // Find user by reset token
  const user = await (User as any).findByPasswordResetToken(token);
  if (!user) {
    throw new AuthenticationError('Invalid or expired reset token');
  }
  
  // Update password and clear reset token
  user.password = password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();
  
  logger.info('Password reset completed', { 
    userId: user._id,
    ip: req.ip 
  });
  
  res.json({
    success: true,
    message: 'Password reset successfully'
  });
}));

/**
 * @route   POST /api/auth/verify-email
 * @desc    Verify email address
 * @access  Public
 */
router.post('/verify-email', asyncHandler(async (req: Request, res: Response) => {
  const { token } = req.body;
  
  if (!token) {
    throw new ValidationError('Verification token is required');
  }
  
  // Find user by verification token
  const user = await (User as any).findByEmailVerificationToken(token);
  if (!user) {
    throw new AuthenticationError('Invalid or expired verification token');
  }
  
  // Mark email as verified
  user.isVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationExpires = undefined;
  await user.save();
  
  logger.info('Email verified', { 
    userId: user._id, 
    email: user.email,
    ip: req.ip 
  });
  
  res.json({
    success: true,
    message: 'Email verified successfully'
  });
}));

/**
 * @route   POST /api/auth/resend-verification
 * @desc    Resend email verification
 * @access  Public
 */
router.post('/resend-verification', authLimiter, [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address')
], asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError('Validation failed', errors.array());
  }
  
  const { email } = req.body;
  
  const user = await User.findOne({ email });
  if (!user) {
    // Don't reveal if user exists or not
    return res.json({
      success: true,
      message: 'If an account with that email exists and is not verified, a verification email has been sent.'
    });
  }
  
  if (user.isVerified) {
    return res.json({
      success: true,
      message: 'Email is already verified'
    });
  }
  
  // Generate new verification token
  const verificationToken = user.generateEmailVerificationToken();
  await user.save();
  
  // TODO: Send verification email
  // await sendVerificationEmail(user.email, verificationToken);
  
  logger.info('Email verification resent', { 
    userId: user._id, 
    email: user.email,
    ip: req.ip 
  });
  
  res.json({
    success: true,
    message: 'If an account with that email exists and is not verified, a verification email has been sent.'
  });
}));

/**
 * @route   DELETE /api/auth/account
 * @desc    Delete user account
 * @access  Private
 */
router.delete('/account', authenticate, [
  body('password')
    .notEmpty()
    .withMessage('Password is required to delete account')
], asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError('Validation failed', errors.array());
  }
  
  const { password } = req.body;
  
  const user = await User.findById(req.user!.id).select('+password');
  if (!user) {
    throw new AuthenticationError('User not found');
  }
  
  // Verify password
  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    throw new AuthenticationError('Password is incorrect');
  }
  
  // TODO: Clean up user data (designs, sessions, files)
  
  // Delete user account
  await User.findByIdAndDelete(user._id);
  
  // Clear auth cookies
  clearAuthCookies(res);
  
  logger.info('User account deleted', { 
    userId: user._id, 
    email: user.email,
    ip: req.ip 
  });
  
  res.json({
    success: true,
    message: 'Account deleted successfully'
  });
}));

/**
 * @route   GET /api/auth/admin/users
 * @desc    Get all users (admin only)
 * @access  Private (Admin)
 */
router.get('/admin/users', authenticate, requireAdmin, asyncHandler(async (req: Request, res: Response) => {
  try {
    const users = await User.find({})
      .select('-password -passwordResetToken -passwordResetExpires -emailVerificationToken -emailVerificationExpires')
      .sort({ createdAt: -1 });
    
    const userStats = await User.getStatistics();
    
    logger.info('Admin retrieved user list', {
      adminId: req.user!.id,
      userCount: users.length,
      ip: req.ip
    });
    
    res.json({
      success: true,
      data: {
        users,
        statistics: userStats
      }
    });
  } catch (error) {
    logger.error('Failed to retrieve users for admin', error as Error, {
      adminId: req.user!.id
    });
    throw error;
  }
}));

/**
 * @route   PUT /api/auth/admin/promote/:userId
 * @desc    Promote a user to admin role (admin only)
 * @access  Private (Admin)
 */
router.put('/admin/promote/:userId', authenticate, requireAdmin, [
  param('userId').isMongoId().withMessage('Invalid user ID')
], asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError('Validation failed', errors.array());
  }
  
  const { userId } = req.params;
  
  const user = await User.findById(userId);
  if (!user) {
    throw new NotFoundError('User not found');
  }
  
  if (user.role === 'admin') {
    throw new ValidationError('User is already an admin');
  }
  
  user.role = 'admin';
  await user.save();
  
  logger.info('User promoted to admin', {
    promotedUserId: userId,
    promotedBy: req.user!.id,
    ip: req.ip
  });
  
  res.json({
    success: true,
    message: 'User promoted to admin successfully',
    data: {
      user: user.getPublicProfile()
    }
  });
}));

/**
 * @route   PUT /api/auth/admin/demote/:userId
 * @desc    Demote an admin user to regular user (admin only)
 * @access  Private (Admin)
 */
router.put('/admin/demote/:userId', authenticate, requireAdmin, [
  param('userId').isMongoId().withMessage('Invalid user ID')
], asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError('Validation failed', errors.array());
  }
  
  const { userId } = req.params;
  
  const user = await User.findById(userId);
  if (!user) {
    throw new NotFoundError('User not found');
  }
  
  if (user.role === 'user') {
    throw new ValidationError('User is already a regular user');
  }
  
  // Prevent self-demotion
  if (user._id.toString() === req.user!.id) {
    throw new ValidationError('You cannot demote yourself');
  }
  
  user.role = 'user';
  await user.save();
  
  logger.info('Admin demoted to user', {
    demotedUserId: userId,
    demotedBy: req.user!.id,
    ip: req.ip
  });
  
  res.json({
    success: true,
    message: 'Admin demoted to user successfully',
    data: {
      user: user.getPublicProfile()
    }
  });
}));

export default router;