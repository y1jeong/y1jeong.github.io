import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';
import { logger } from '@/utils/logger';

// User interface
export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'user' | 'admin';
  isActive: boolean;
  isVerified: boolean;
  emailVerificationToken?: string;
  emailVerificationExpires?: Date;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  lastLogin?: Date;
  loginAttempts: number;
  lockUntil?: Date;
  preferences: {
    defaultUnits: 'inches' | 'mm';
    defaultPanelSize: {
      width: number;
      height: number;
    };
    defaultPerforationSettings: {
      minSize: number;
      maxSize: number;
      shape: 'circle' | 'rectangle' | 'polygon';
      pattern: 'grid' | 'staggered' | 'random';
      spacing: {
        horizontal: number;
        diagonal: number;
      };
    };
  };
  createdAt: Date;
  updatedAt: Date;
  
  // Methods
  comparePassword(candidatePassword: string): Promise<boolean>;
  incrementLoginAttempts(): Promise<void>;
  resetLoginAttempts(): Promise<void>;
  isLocked(): boolean;
  generateEmailVerificationToken(): string;
  generatePasswordResetToken(): string;
  getPublicProfile(): object;
}

// User schema
const userSchema = new Schema<IUser>({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please provide a valid email address']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters long'],
    select: false // Don't include password in queries by default
  },
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    maxlength: [50, 'First name cannot exceed 50 characters']
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    maxlength: [50, 'Last name cannot exceed 50 characters']
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: {
    type: String,
    select: false
  },
  emailVerificationExpires: {
    type: Date,
    select: false
  },
  passwordResetToken: {
    type: String,
    select: false
  },
  passwordResetExpires: {
    type: Date,
    select: false
  },
  lastLogin: {
    type: Date
  },
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: {
    type: Date
  },
  preferences: {
    defaultUnits: {
      type: String,
      enum: ['inches', 'mm'],
      default: 'inches'
    },
    defaultPanelSize: {
      width: {
        type: Number,
        default: 24, // inches
        min: [1, 'Panel width must be at least 1 inch'],
        max: [120, 'Panel width cannot exceed 120 inches']
      },
      height: {
        type: Number,
        default: 36, // inches
        min: [1, 'Panel height must be at least 1 inch'],
        max: [120, 'Panel height cannot exceed 120 inches']
      }
    },
    defaultPerforationSettings: {
      minSize: {
        type: Number,
        default: 0.125, // 1/8 inch
        min: [0.01, 'Minimum perforation size must be at least 0.01 inches']
      },
      maxSize: {
        type: Number,
        default: 1.0, // 1 inch
        max: [6, 'Maximum perforation size cannot exceed 6 inches']
      },
      shape: {
        type: String,
        enum: ['circle', 'rectangle', 'polygon'],
        default: 'circle'
      },
      pattern: {
        type: String,
        enum: ['grid', 'staggered', 'random'],
        default: 'grid'
      },
      spacing: {
        horizontal: {
          type: Number,
          default: 0.5, // inches
          min: [0.1, 'Horizontal spacing must be at least 0.1 inches']
        },
        diagonal: {
          type: Number,
          default: 0.5, // inches
          min: [0.1, 'Diagonal spacing must be at least 0.1 inches']
        }
      }
    }
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      delete ret.password;
      delete ret.emailVerificationToken;
      delete ret.emailVerificationExpires;
      delete ret.passwordResetToken;
      delete ret.passwordResetExpires;
      delete ret.__v;
      return ret;
    }
  }
});

// Indexes
userSchema.index({ email: 1 });
userSchema.index({ emailVerificationToken: 1 });
userSchema.index({ passwordResetToken: 1 });
userSchema.index({ createdAt: 1 });
userSchema.index({ lastLogin: 1 });

// Constants for account locking
const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_TIME = 2 * 60 * 60 * 1000; // 2 hours

// Virtual for account lock status
userSchema.virtual('isLocked').get(function(this: IUser) {
  return !!(this.lockUntil && this.lockUntil > new Date());
});

// Pre-save middleware to hash password
userSchema.pre('save', async function(this: IUser, next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) return next();
  
  try {
    // Hash password with cost of 12
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    
    logger.debug('Password hashed successfully', { userId: this._id });
    next();
  } catch (error) {
    logger.error('Password hashing failed', error as Error, { userId: this._id });
    next(error as Error);
  }
});

// Pre-save middleware to validate preferences
userSchema.pre('save', function(this: IUser, next) {
  // Ensure max size is greater than min size
  if (this.preferences.defaultPerforationSettings.maxSize <= this.preferences.defaultPerforationSettings.minSize) {
    return next(new Error('Maximum perforation size must be greater than minimum size'));
  }
  
  next();
});

// Instance method to compare password
userSchema.methods.comparePassword = async function(this: IUser, candidatePassword: string): Promise<boolean> {
  try {
    const isMatch = await bcrypt.compare(candidatePassword, this.password);
    logger.debug('Password comparison completed', { userId: this._id, isMatch });
    return isMatch;
  } catch (error) {
    logger.error('Password comparison failed', error as Error, { userId: this._id });
    throw error;
  }
};

// Instance method to increment login attempts
userSchema.methods.incrementLoginAttempts = async function(this: IUser): Promise<void> {
  // If we have a previous lock that has expired, restart at 1
  if (this.lockUntil && this.lockUntil < new Date()) {
    return this.updateOne({
      $unset: { lockUntil: 1 },
      $set: { loginAttempts: 1 }
    });
  }
  
  const updates: any = { $inc: { loginAttempts: 1 } };
  
  // If we have hit max attempts and it's not locked already, lock the account
  if (this.loginAttempts + 1 >= MAX_LOGIN_ATTEMPTS && !this.isLocked()) {
    updates.$set = { lockUntil: new Date(Date.now() + LOCK_TIME) };
    logger.warn('Account locked due to too many failed login attempts', { 
      userId: this._id, 
      email: this.email,
      attempts: this.loginAttempts + 1
    });
  }
  
  return this.updateOne(updates);
};

// Instance method to reset login attempts
userSchema.methods.resetLoginAttempts = async function(this: IUser): Promise<void> {
  return this.updateOne({
    $unset: { loginAttempts: 1, lockUntil: 1 }
  });
};

// Instance method to check if account is locked
userSchema.methods.isLocked = function(this: IUser): boolean {
  return !!(this.lockUntil && this.lockUntil > new Date());
};

// Instance method to generate email verification token
userSchema.methods.generateEmailVerificationToken = function(this: IUser): string {
  const crypto = require('crypto');
  const token = crypto.randomBytes(32).toString('hex');
  
  this.emailVerificationToken = crypto.createHash('sha256').update(token).digest('hex');
  this.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
  
  return token;
};

// Instance method to generate password reset token
userSchema.methods.generatePasswordResetToken = function(this: IUser): string {
  const crypto = require('crypto');
  const token = crypto.randomBytes(32).toString('hex');
  
  this.passwordResetToken = crypto.createHash('sha256').update(token).digest('hex');
  this.passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
  
  return token;
};

// Instance method to get public profile
userSchema.methods.getPublicProfile = function(this: IUser): object {
  return {
    id: this._id,
    email: this.email,
    firstName: this.firstName,
    lastName: this.lastName,
    role: this.role,
    isVerified: this.isVerified,
    preferences: this.preferences,
    createdAt: this.createdAt,
    lastLogin: this.lastLogin
  };
};

// Static method to find user by email verification token
userSchema.statics.findByEmailVerificationToken = function(token: string) {
  const crypto = require('crypto');
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
  
  return this.findOne({
    emailVerificationToken: hashedToken,
    emailVerificationExpires: { $gt: new Date() }
  });
};

// Static method to find user by password reset token
userSchema.statics.findByPasswordResetToken = function(token: string) {
  const crypto = require('crypto');
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
  
  return this.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: new Date() }
  });
};

// Static method to get user statistics
userSchema.statics.getStatistics = async function() {
  const totalUsers = await this.countDocuments();
  const activeUsers = await this.countDocuments({ isActive: true });
  const verifiedUsers = await this.countDocuments({ isVerified: true });
  const adminUsers = await this.countDocuments({ role: 'admin' });
  
  const recentUsers = await this.countDocuments({
    createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Last 30 days
  });
  
  return {
    total: totalUsers,
    active: activeUsers,
    verified: verifiedUsers,
    admins: adminUsers,
    recentSignups: recentUsers
  };
};

// Export the model
export const User = mongoose.model<IUser>('User', userSchema);
export default User;