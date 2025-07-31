import mongoose, { Document, Schema } from 'mongoose';
import { logger } from '@/utils/logger';

// Session data interface for storing temporary design work
export interface ISessionData {
  // Current design being worked on
  currentDesign?: {
    panelSpecs?: {
      width: number;
      height: number;
      thickness?: number;
      material?: string;
    };
    perforationSettings?: {
      minSize: number;
      maxSize: number;
      shape: any;
      pattern: string;
      spacing: {
        horizontal: number;
        diagonal: number;
      };
      density: any;
      rotation: any;
    };
    imageSettings?: {
      processing: {
        contrast: number;
        brightness: number;
        gamma: number;
        invert: boolean;
        blur: number;
      };
    };
    exportSettings?: any;
  };
  
  // UI state
  uiState?: {
    activeTab: string;
    sidebarCollapsed: boolean;
    previewSettings: {
      zoom: number;
      pan: { x: number; y: number };
      rotation: number;
      showGrid: boolean;
      showDimensions: boolean;
    };
    toolboxSettings: {
      selectedTool: string;
      brushSize?: number;
      eraserSize?: number;
    };
  };
  
  // Temporary files
  tempFiles?: {
    originalImage?: string;
    processedImage?: string;
    previewImage?: string;
  };
  
  // Processing state
  processing?: {
    status: 'idle' | 'uploading' | 'processing' | 'generating' | 'exporting';
    progress: number;
    currentStep: string;
    estimatedTimeRemaining?: number;
  };
  
  // User preferences for this session
  preferences?: {
    autoSave: boolean;
    realTimePreview: boolean;
    highQualityPreview: boolean;
    showTooltips: boolean;
  };
}

// Session interface
export interface ISession extends Document {
  _id: mongoose.Types.ObjectId;
  sessionId: string; // Unique session identifier
  userId?: mongoose.Types.ObjectId; // Optional - for authenticated users
  ipAddress: string;
  userAgent: string;
  
  // Session data
  data: ISessionData;
  
  // Session metadata
  isActive: boolean;
  lastActivity: Date;
  expiresAt: Date;
  
  // Device/browser info
  deviceInfo?: {
    type: 'desktop' | 'tablet' | 'mobile';
    os: string;
    browser: string;
    screenResolution?: {
      width: number;
      height: number;
    };
  };
  
  // Geographic info (optional)
  location?: {
    country?: string;
    region?: string;
    city?: string;
    timezone?: string;
  };
  
  // Analytics
  pageViews: number;
  actionsPerformed: number;
  timeSpent: number; // in seconds
  
  createdAt: Date;
  updatedAt: Date;
  
  // Methods
  updateActivity(): Promise<void>;
  extendExpiration(minutes?: number): Promise<void>;
  cleanup(): Promise<void>;
  isExpired(): boolean;
  getPublicData(): object;
}

// Session schema
const sessionSchema = new Schema<ISession>({
  sessionId: {
    type: String,
    required: [true, 'Session ID is required'],
    unique: true,
    index: true
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  ipAddress: {
    type: String,
    required: [true, 'IP address is required'],
    validate: {
      validator: function(ip: string) {
        // Basic IP validation (IPv4 and IPv6)
        const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
        const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
        return ipv4Regex.test(ip) || ipv6Regex.test(ip) || ip === '::1' || ip === 'localhost';
      },
      message: 'Invalid IP address format'
    }
  },
  userAgent: {
    type: String,
    required: [true, 'User agent is required'],
    maxlength: [500, 'User agent cannot exceed 500 characters']
  },
  
  data: {
    currentDesign: {
      panelSpecs: {
        width: {
          type: Number,
          min: [1, 'Panel width must be at least 1 inch'],
          max: [120, 'Panel width cannot exceed 120 inches']
        },
        height: {
          type: Number,
          min: [1, 'Panel height must be at least 1 inch'],
          max: [120, 'Panel height cannot exceed 120 inches']
        },
        thickness: {
          type: Number,
          min: [0.01, 'Panel thickness must be at least 0.01 inches'],
          max: [6, 'Panel thickness cannot exceed 6 inches']
        },
        material: {
          type: String,
          maxlength: [50, 'Material name cannot exceed 50 characters']
        }
      },
      perforationSettings: {
        minSize: {
          type: Number,
          min: [0.01, 'Minimum size must be at least 0.01 inches']
        },
        maxSize: {
          type: Number,
          max: [6, 'Maximum size cannot exceed 6 inches']
        },
        shape: Schema.Types.Mixed,
        pattern: {
          type: String,
          enum: ['grid', 'staggered', 'random']
        },
        spacing: {
          horizontal: {
            type: Number,
            min: [0.1, 'Horizontal spacing must be at least 0.1 inches']
          },
          diagonal: {
            type: Number,
            min: [0.1, 'Diagonal spacing must be at least 0.1 inches']
          }
        },
        density: Schema.Types.Mixed,
        rotation: Schema.Types.Mixed
      },
      imageSettings: {
        processing: {
          contrast: {
            type: Number,
            min: [-100, 'Contrast must be between -100 and 100'],
            max: [100, 'Contrast must be between -100 and 100']
          },
          brightness: {
            type: Number,
            min: [-100, 'Brightness must be between -100 and 100'],
            max: [100, 'Brightness must be between -100 and 100']
          },
          gamma: {
            type: Number,
            min: [0.1, 'Gamma must be between 0.1 and 3.0'],
            max: [3.0, 'Gamma must be between 0.1 and 3.0']
          },
          invert: Boolean,
          blur: {
            type: Number,
            min: [0, 'Blur must be between 0 and 10'],
            max: [10, 'Blur must be between 0 and 10']
          }
        }
      },
      exportSettings: Schema.Types.Mixed
    },
    
    uiState: {
      activeTab: {
        type: String,
        default: 'design'
      },
      sidebarCollapsed: {
        type: Boolean,
        default: false
      },
      previewSettings: {
        zoom: {
          type: Number,
          default: 1.0,
          min: [0.1, 'Zoom must be between 0.1 and 10'],
          max: [10, 'Zoom must be between 0.1 and 10']
        },
        pan: {
          x: {
            type: Number,
            default: 0
          },
          y: {
            type: Number,
            default: 0
          }
        },
        rotation: {
          type: Number,
          default: 0,
          min: [-360, 'Rotation must be between -360 and 360 degrees'],
          max: [360, 'Rotation must be between -360 and 360 degrees']
        },
        showGrid: {
          type: Boolean,
          default: true
        },
        showDimensions: {
          type: Boolean,
          default: true
        }
      },
      toolboxSettings: {
        selectedTool: {
          type: String,
          default: 'select'
        },
        brushSize: {
          type: Number,
          min: [1, 'Brush size must be at least 1'],
          max: [100, 'Brush size cannot exceed 100']
        },
        eraserSize: {
          type: Number,
          min: [1, 'Eraser size must be at least 1'],
          max: [100, 'Eraser size cannot exceed 100']
        }
      }
    },
    
    tempFiles: {
      originalImage: String,
      processedImage: String,
      previewImage: String
    },
    
    processing: {
      status: {
        type: String,
        enum: ['idle', 'uploading', 'processing', 'generating', 'exporting'],
        default: 'idle'
      },
      progress: {
        type: Number,
        default: 0,
        min: [0, 'Progress cannot be negative'],
        max: [100, 'Progress cannot exceed 100']
      },
      currentStep: {
        type: String,
        default: ''
      },
      estimatedTimeRemaining: {
        type: Number,
        min: [0, 'Estimated time cannot be negative']
      }
    },
    
    preferences: {
      autoSave: {
        type: Boolean,
        default: true
      },
      realTimePreview: {
        type: Boolean,
        default: true
      },
      highQualityPreview: {
        type: Boolean,
        default: false
      },
      showTooltips: {
        type: Boolean,
        default: true
      }
    }
  },
  
  isActive: {
    type: Boolean,
    default: true
  },
  lastActivity: {
    type: Date,
    default: Date.now,
    index: true
  },
  expiresAt: {
    type: Date,
    default: function() {
      // Default expiration: 24 hours for authenticated users, 2 hours for anonymous
      const hours = this.userId ? 24 : 2;
      return new Date(Date.now() + hours * 60 * 60 * 1000);
    },
    index: true
  },
  
  deviceInfo: {
    type: {
      type: String,
      enum: ['desktop', 'tablet', 'mobile']
    },
    os: {
      type: String,
      maxlength: [50, 'OS name cannot exceed 50 characters']
    },
    browser: {
      type: String,
      maxlength: [50, 'Browser name cannot exceed 50 characters']
    },
    screenResolution: {
      width: {
        type: Number,
        min: [1, 'Screen width must be at least 1']
      },
      height: {
        type: Number,
        min: [1, 'Screen height must be at least 1']
      }
    }
  },
  
  location: {
    country: {
      type: String,
      maxlength: [50, 'Country name cannot exceed 50 characters']
    },
    region: {
      type: String,
      maxlength: [50, 'Region name cannot exceed 50 characters']
    },
    city: {
      type: String,
      maxlength: [50, 'City name cannot exceed 50 characters']
    },
    timezone: {
      type: String,
      maxlength: [50, 'Timezone cannot exceed 50 characters']
    }
  },
  
  pageViews: {
    type: Number,
    default: 0,
    min: [0, 'Page views cannot be negative']
  },
  actionsPerformed: {
    type: Number,
    default: 0,
    min: [0, 'Actions performed cannot be negative']
  },
  timeSpent: {
    type: Number,
    default: 0,
    min: [0, 'Time spent cannot be negative']
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      delete ret.__v;
      return ret;
    }
  }
});

// Indexes
sessionSchema.index({ sessionId: 1 }, { unique: true });
sessionSchema.index({ userId: 1 });
sessionSchema.index({ ipAddress: 1 });
sessionSchema.index({ lastActivity: -1 });
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index
sessionSchema.index({ isActive: 1, lastActivity: -1 });
sessionSchema.index({ createdAt: -1 });

// Pre-save middleware
sessionSchema.pre('save', function(this: ISession, next) {
  // Update last activity on save
  if (this.isModified() && !this.isModified('lastActivity')) {
    this.lastActivity = new Date();
  }
  
  // Validate perforation settings if present
  if (this.data.currentDesign?.perforationSettings) {
    const settings = this.data.currentDesign.perforationSettings;
    if (settings.minSize && settings.maxSize && settings.maxSize <= settings.minSize) {
      return next(new Error('Maximum perforation size must be greater than minimum size'));
    }
  }
  
  next();
});

// Instance method to update activity
sessionSchema.methods.updateActivity = async function(this: ISession): Promise<void> {
  this.lastActivity = new Date();
  this.isActive = true;
  await this.save();
  logger.debug('Session activity updated', { sessionId: this.sessionId });
};

// Instance method to extend expiration
sessionSchema.methods.extendExpiration = async function(this: ISession, minutes: number = 120): Promise<void> {
  this.expiresAt = new Date(Date.now() + minutes * 60 * 1000);
  await this.save();
  logger.debug('Session expiration extended', { 
    sessionId: this.sessionId, 
    expiresAt: this.expiresAt 
  });
};

// Instance method to cleanup session data
sessionSchema.methods.cleanup = async function(this: ISession): Promise<void> {
  // Clean up temporary files
  if (this.data.tempFiles) {
    const fs = require('fs').promises;
    const path = require('path');
    
    for (const [key, filePath] of Object.entries(this.data.tempFiles)) {
      if (filePath && typeof filePath === 'string') {
        try {
          await fs.unlink(path.resolve(filePath));
          logger.debug('Temporary file cleaned up', { sessionId: this.sessionId, file: key });
        } catch (error) {
          logger.warn('Failed to clean up temporary file', error as Error, { 
            sessionId: this.sessionId, 
            file: key 
          });
        }
      }
    }
  }
  
  // Mark session as inactive
  this.isActive = false;
  await this.save();
  
  logger.info('Session cleaned up', { sessionId: this.sessionId });
};

// Instance method to check if session is expired
sessionSchema.methods.isExpired = function(this: ISession): boolean {
  return this.expiresAt < new Date();
};

// Instance method to get public data
sessionSchema.methods.getPublicData = function(this: ISession): object {
  return {
    sessionId: this.sessionId,
    isActive: this.isActive,
    lastActivity: this.lastActivity,
    expiresAt: this.expiresAt,
    deviceInfo: this.deviceInfo,
    preferences: this.data.preferences,
    uiState: this.data.uiState,
    processing: this.data.processing
  };
};

// Static method to cleanup expired sessions
sessionSchema.statics.cleanupExpiredSessions = async function() {
  const expiredSessions = await this.find({
    $or: [
      { expiresAt: { $lt: new Date() } },
      { lastActivity: { $lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } // 7 days old
    ]
  });
  
  for (const session of expiredSessions) {
    await session.cleanup();
  }
  
  const deletedCount = await this.deleteMany({
    $or: [
      { expiresAt: { $lt: new Date() } },
      { lastActivity: { $lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } }
    ]
  });
  
  logger.info('Expired sessions cleaned up', { count: deletedCount.deletedCount });
  return deletedCount.deletedCount;
};

// Static method to get active sessions count
sessionSchema.statics.getActiveSessionsCount = function() {
  return this.countDocuments({
    isActive: true,
    expiresAt: { $gt: new Date() }
  });
};

// Static method to get session statistics
sessionSchema.statics.getStatistics = async function() {
  const totalSessions = await this.countDocuments();
  const activeSessions = await this.countDocuments({ 
    isActive: true, 
    expiresAt: { $gt: new Date() } 
  });
  const authenticatedSessions = await this.countDocuments({ 
    userId: { $exists: true }, 
    isActive: true 
  });
  const anonymousSessions = await this.countDocuments({ 
    userId: { $exists: false }, 
    isActive: true 
  });
  
  const recentSessions = await this.countDocuments({
    createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24 hours
  });
  
  const avgTimeSpent = await this.aggregate([
    { $match: { timeSpent: { $gt: 0 } } },
    { $group: { _id: null, avgTime: { $avg: '$timeSpent' } } }
  ]);
  
  const deviceStats = await this.aggregate([
    { $match: { 'deviceInfo.type': { $exists: true } } },
    { $group: { _id: '$deviceInfo.type', count: { $sum: 1 } } }
  ]);
  
  return {
    total: totalSessions,
    active: activeSessions,
    authenticated: authenticatedSessions,
    anonymous: anonymousSessions,
    recent: recentSessions,
    averageTimeSpent: avgTimeSpent[0]?.avgTime || 0,
    deviceBreakdown: deviceStats.reduce((acc: any, stat: any) => {
      acc[stat._id] = stat.count;
      return acc;
    }, {})
  };
};

// Export the model
export const Session = mongoose.model<ISession>('Session', sessionSchema);
export default Session;