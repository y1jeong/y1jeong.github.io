import mongoose, { Document, Schema } from 'mongoose';
import { logger } from '@/utils/logger';

// Perforation shape interface
export interface IPerforationShape {
  type: 'circle' | 'rectangle' | 'polygon' | 'custom';
  parameters: {
    // For circle: radius
    radius?: number;
    // For rectangle: width, height
    width?: number;
    height?: number;
    // For polygon: sides, radius
    sides?: number;
    // For custom: SVG path data
    pathData?: string;
    // Common properties
    rotation?: number; // in degrees
  };
}

// Perforation settings interface
export interface IPerforationSettings {
  minSize: number; // in inches
  maxSize: number; // in inches
  shape: IPerforationShape;
  pattern: 'grid' | 'staggered' | 'random';
  spacing: {
    horizontal: number; // in inches
    diagonal: number; // in inches
  };
  density: {
    method: 'grayscale' | 'contrast' | 'manual';
    threshold?: number; // 0-255 for grayscale/contrast
    manualDensity?: number; // 0-1 for manual
  };
  rotation: {
    global: number; // global rotation in degrees
    individual: number; // individual perforation rotation in degrees
    randomize: boolean; // randomize individual rotations
  };
}

// Panel specifications interface
export interface IPanelSpecs {
  width: number; // in inches
  height: number; // in inches
  thickness?: number; // in inches (optional)
  material?: string; // material type (optional)
  units: 'inches'; // only imperial units supported
}

// Image processing settings interface
export interface IImageSettings {
  originalFilename: string;
  mimeType: string;
  size: number; // file size in bytes
  dimensions: {
    width: number;
    height: number;
  };
  processing: {
    contrast: number; // -100 to 100
    brightness: number; // -100 to 100
    gamma: number; // 0.1 to 3.0
    invert: boolean;
    blur: number; // 0 to 10
  };
}

// Export settings interface
export interface IExportSettings {
  formats: ('dxf' | 'svg' | 'pdf')[];
  dxf?: {
    units: 'inches' | 'mm';
    layerName: string;
    precision: number; // decimal places
  };
  svg?: {
    units: 'in' | 'mm' | 'px';
    strokeWidth: number;
    fillColor: string;
    strokeColor: string;
  };
  pdf?: {
    pageSize: 'A4' | 'A3' | 'Letter' | 'Legal' | 'custom';
    orientation: 'portrait' | 'landscape';
    scale: number; // scale factor
    showDimensions: boolean;
  };
}

// Design interface
export interface IDesign extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  version: number;
  isPublic: boolean;
  tags: string[];
  
  // Design specifications
  panelSpecs: IPanelSpecs;
  perforationSettings: IPerforationSettings;
  imageSettings: IImageSettings;
  exportSettings: IExportSettings;
  
  // File references
  imageFile: {
    filename: string;
    path: string;
    url: string;
  };
  previewImage?: {
    filename: string;
    path: string;
    url: string;
  };
  
  // Generated data
  perforationData?: {
    totalPerforations: number;
    averageSize: number;
    coverage: number; // percentage of panel covered
    generatedAt: Date;
  };
  
  // Metadata
  status: 'draft' | 'processing' | 'completed' | 'error';
  processingProgress?: number; // 0-100
  errorMessage?: string;
  
  // Collaboration
  sharedWith: {
    userId: mongoose.Types.ObjectId;
    permission: 'view' | 'edit';
    sharedAt: Date;
  }[];
  
  // Analytics
  views: number;
  downloads: number;
  lastAccessed: Date;
  
  createdAt: Date;
  updatedAt: Date;
  
  // Methods
  incrementViews(): Promise<void>;
  incrementDownloads(): Promise<void>;
  updateLastAccessed(): Promise<void>;
  createVersion(): Promise<IDesign>;
  getPublicData(): object;
  canUserAccess(userId: string, permission?: 'view' | 'edit'): boolean;
}

// Design schema
const designSchema = new Schema<IDesign>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true
  },
  name: {
    type: String,
    required: [true, 'Design name is required'],
    trim: true,
    maxlength: [100, 'Design name cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  version: {
    type: Number,
    default: 1,
    min: [1, 'Version must be at least 1']
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: [30, 'Tag cannot exceed 30 characters']
  }],
  
  panelSpecs: {
    width: {
      type: Number,
      required: [true, 'Panel width is required'],
      min: [1, 'Panel width must be at least 1 inch'],
      max: [120, 'Panel width cannot exceed 120 inches']
    },
    height: {
      type: Number,
      required: [true, 'Panel height is required'],
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
      trim: true,
      maxlength: [50, 'Material name cannot exceed 50 characters']
    },
    units: {
      type: String,
      enum: ['inches'],
      default: 'inches'
    }
  },
  
  perforationSettings: {
    minSize: {
      type: Number,
      required: [true, 'Minimum perforation size is required'],
      min: [0.01, 'Minimum size must be at least 0.01 inches']
    },
    maxSize: {
      type: Number,
      required: [true, 'Maximum perforation size is required'],
      max: [6, 'Maximum size cannot exceed 6 inches']
    },
    shape: {
      type: {
        type: String,
        enum: ['circle', 'rectangle', 'polygon', 'custom'],
        required: true
      },
      parameters: {
        radius: Number,
        width: Number,
        height: Number,
        sides: {
          type: Number,
          min: [3, 'Polygon must have at least 3 sides'],
          max: [20, 'Polygon cannot have more than 20 sides']
        },
        pathData: String,
        rotation: {
          type: Number,
          default: 0,
          min: [-360, 'Rotation cannot be less than -360 degrees'],
          max: [360, 'Rotation cannot exceed 360 degrees']
        }
      }
    },
    pattern: {
      type: String,
      enum: ['grid', 'staggered', 'random'],
      required: [true, 'Perforation pattern is required']
    },
    spacing: {
      horizontal: {
        type: Number,
        required: [true, 'Horizontal spacing is required'],
        min: [0.1, 'Horizontal spacing must be at least 0.1 inches']
      },
      diagonal: {
        type: Number,
        required: [true, 'Diagonal spacing is required'],
        min: [0.1, 'Diagonal spacing must be at least 0.1 inches']
      }
    },
    density: {
      method: {
        type: String,
        enum: ['grayscale', 'contrast', 'manual'],
        required: [true, 'Density method is required']
      },
      threshold: {
        type: Number,
        min: [0, 'Threshold must be between 0 and 255'],
        max: [255, 'Threshold must be between 0 and 255']
      },
      manualDensity: {
        type: Number,
        min: [0, 'Manual density must be between 0 and 1'],
        max: [1, 'Manual density must be between 0 and 1']
      }
    },
    rotation: {
      global: {
        type: Number,
        default: 0,
        min: [-360, 'Global rotation cannot be less than -360 degrees'],
        max: [360, 'Global rotation cannot exceed 360 degrees']
      },
      individual: {
        type: Number,
        default: 0,
        min: [-360, 'Individual rotation cannot be less than -360 degrees'],
        max: [360, 'Individual rotation cannot exceed 360 degrees']
      },
      randomize: {
        type: Boolean,
        default: false
      }
    }
  },
  
  imageSettings: {
    originalFilename: {
      type: String,
      required: [true, 'Original filename is required']
    },
    mimeType: {
      type: String,
      required: [true, 'MIME type is required'],
      enum: ['image/jpeg', 'image/png', 'image/svg+xml']
    },
    size: {
      type: Number,
      required: [true, 'File size is required'],
      min: [1, 'File size must be at least 1 byte'],
      max: [50 * 1024 * 1024, 'File size cannot exceed 50MB']
    },
    dimensions: {
      width: {
        type: Number,
        required: [true, 'Image width is required'],
        min: [1, 'Image width must be at least 1 pixel']
      },
      height: {
        type: Number,
        required: [true, 'Image height is required'],
        min: [1, 'Image height must be at least 1 pixel']
      }
    },
    processing: {
      contrast: {
        type: Number,
        default: 0,
        min: [-100, 'Contrast must be between -100 and 100'],
        max: [100, 'Contrast must be between -100 and 100']
      },
      brightness: {
        type: Number,
        default: 0,
        min: [-100, 'Brightness must be between -100 and 100'],
        max: [100, 'Brightness must be between -100 and 100']
      },
      gamma: {
        type: Number,
        default: 1.0,
        min: [0.1, 'Gamma must be between 0.1 and 3.0'],
        max: [3.0, 'Gamma must be between 0.1 and 3.0']
      },
      invert: {
        type: Boolean,
        default: false
      },
      blur: {
        type: Number,
        default: 0,
        min: [0, 'Blur must be between 0 and 10'],
        max: [10, 'Blur must be between 0 and 10']
      }
    }
  },
  
  exportSettings: {
    formats: [{
      type: String,
      enum: ['dxf', 'svg', 'pdf']
    }],
    dxf: {
      units: {
        type: String,
        enum: ['inches', 'mm'],
        default: 'inches'
      },
      layerName: {
        type: String,
        default: 'PERFORATIONS',
        maxlength: [50, 'Layer name cannot exceed 50 characters']
      },
      precision: {
        type: Number,
        default: 3,
        min: [0, 'Precision must be between 0 and 6'],
        max: [6, 'Precision must be between 0 and 6']
      }
    },
    svg: {
      units: {
        type: String,
        enum: ['in', 'mm', 'px'],
        default: 'in'
      },
      strokeWidth: {
        type: Number,
        default: 0.01,
        min: [0.001, 'Stroke width must be at least 0.001']
      },
      fillColor: {
        type: String,
        default: '#000000',
        match: [/^#[0-9A-Fa-f]{6}$/, 'Fill color must be a valid hex color']
      },
      strokeColor: {
        type: String,
        default: '#000000',
        match: [/^#[0-9A-Fa-f]{6}$/, 'Stroke color must be a valid hex color']
      }
    },
    pdf: {
      pageSize: {
        type: String,
        enum: ['A4', 'A3', 'Letter', 'Legal', 'custom'],
        default: 'Letter'
      },
      orientation: {
        type: String,
        enum: ['portrait', 'landscape'],
        default: 'portrait'
      },
      scale: {
        type: Number,
        default: 1.0,
        min: [0.1, 'Scale must be between 0.1 and 10'],
        max: [10, 'Scale must be between 0.1 and 10']
      },
      showDimensions: {
        type: Boolean,
        default: true
      }
    }
  },
  
  imageFile: {
    filename: {
      type: String,
      required: [true, 'Image filename is required']
    },
    path: {
      type: String,
      required: [true, 'Image path is required']
    },
    url: {
      type: String,
      required: [true, 'Image URL is required']
    }
  },
  
  previewImage: {
    filename: String,
    path: String,
    url: String
  },
  
  perforationData: {
    totalPerforations: {
      type: Number,
      min: [0, 'Total perforations cannot be negative']
    },
    averageSize: {
      type: Number,
      min: [0, 'Average size cannot be negative']
    },
    coverage: {
      type: Number,
      min: [0, 'Coverage cannot be negative'],
      max: [100, 'Coverage cannot exceed 100%']
    },
    generatedAt: Date
  },
  
  status: {
    type: String,
    enum: ['draft', 'processing', 'completed', 'error'],
    default: 'draft'
  },
  processingProgress: {
    type: Number,
    min: [0, 'Processing progress cannot be negative'],
    max: [100, 'Processing progress cannot exceed 100']
  },
  errorMessage: {
    type: String,
    maxlength: [500, 'Error message cannot exceed 500 characters']
  },
  
  sharedWith: [{
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    permission: {
      type: String,
      enum: ['view', 'edit'],
      required: true
    },
    sharedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  views: {
    type: Number,
    default: 0,
    min: [0, 'Views cannot be negative']
  },
  downloads: {
    type: Number,
    default: 0,
    min: [0, 'Downloads cannot be negative']
  },
  lastAccessed: {
    type: Date,
    default: Date.now
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
designSchema.index({ userId: 1, createdAt: -1 });
designSchema.index({ name: 'text', description: 'text', tags: 'text' });
designSchema.index({ isPublic: 1, createdAt: -1 });
designSchema.index({ status: 1 });
designSchema.index({ tags: 1 });
designSchema.index({ 'sharedWith.userId': 1 });
designSchema.index({ lastAccessed: -1 });
designSchema.index({ views: -1 });
designSchema.index({ downloads: -1 });

// Pre-save validation
designSchema.pre('save', function(this: IDesign, next) {
  // Ensure max size is greater than min size
  if (this.perforationSettings.maxSize <= this.perforationSettings.minSize) {
    return next(new Error('Maximum perforation size must be greater than minimum size'));
  }
  
  // Validate density settings based on method
  const density = this.perforationSettings.density;
  if ((density.method === 'grayscale' || density.method === 'contrast') && density.threshold === undefined) {
    return next(new Error('Threshold is required for grayscale and contrast density methods'));
  }
  
  if (density.method === 'manual' && density.manualDensity === undefined) {
    return next(new Error('Manual density value is required for manual density method'));
  }
  
  // Validate shape parameters
  const shape = this.perforationSettings.shape;
  if (shape.type === 'circle' && !shape.parameters.radius) {
    return next(new Error('Radius is required for circle shape'));
  }
  
  if (shape.type === 'rectangle' && (!shape.parameters.width || !shape.parameters.height)) {
    return next(new Error('Width and height are required for rectangle shape'));
  }
  
  if (shape.type === 'polygon' && !shape.parameters.sides) {
    return next(new Error('Number of sides is required for polygon shape'));
  }
  
  if (shape.type === 'custom' && !shape.parameters.pathData) {
    return next(new Error('Path data is required for custom shape'));
  }
  
  next();
});

// Instance method to increment views
designSchema.methods.incrementViews = async function(this: IDesign): Promise<void> {
  this.views += 1;
  this.lastAccessed = new Date();
  await this.save();
  logger.debug('Design views incremented', { designId: this._id, views: this.views });
};

// Instance method to increment downloads
designSchema.methods.incrementDownloads = async function(this: IDesign): Promise<void> {
  this.downloads += 1;
  this.lastAccessed = new Date();
  await this.save();
  logger.debug('Design downloads incremented', { designId: this._id, downloads: this.downloads });
};

// Instance method to update last accessed
designSchema.methods.updateLastAccessed = async function(this: IDesign): Promise<void> {
  this.lastAccessed = new Date();
  await this.save();
};

// Instance method to create a new version
designSchema.methods.createVersion = async function(this: IDesign): Promise<IDesign> {
  const newDesign = new Design({
    ...this.toObject(),
    _id: undefined,
    version: this.version + 1,
    views: 0,
    downloads: 0,
    createdAt: undefined,
    updatedAt: undefined
  });
  
  await newDesign.save();
  logger.info('New design version created', { 
    originalId: this._id, 
    newId: newDesign._id, 
    version: newDesign.version 
  });
  
  return newDesign;
};

// Instance method to get public data
designSchema.methods.getPublicData = function(this: IDesign): object {
  return {
    id: this._id,
    name: this.name,
    description: this.description,
    version: this.version,
    tags: this.tags,
    panelSpecs: this.panelSpecs,
    previewImage: this.previewImage,
    views: this.views,
    downloads: this.downloads,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
};

// Instance method to check user access
designSchema.methods.canUserAccess = function(this: IDesign, userId: string, permission: 'view' | 'edit' = 'view'): boolean {
  // Owner has full access
  if (this.userId.toString() === userId) {
    return true;
  }
  
  // Public designs can be viewed by anyone
  if (this.isPublic && permission === 'view') {
    return true;
  }
  
  // Check shared permissions
  const sharedAccess = this.sharedWith.find(share => share.userId.toString() === userId);
  if (sharedAccess) {
    if (permission === 'view') {
      return true;
    }
    if (permission === 'edit' && sharedAccess.permission === 'edit') {
      return true;
    }
  }
  
  return false;
};

// Static method to get user's designs
designSchema.statics.getUserDesigns = function(userId: string, options: any = {}) {
  const query = { userId };
  const sort = options.sort || { updatedAt: -1 };
  const limit = options.limit || 20;
  const skip = options.skip || 0;
  
  return this.find(query)
    .sort(sort)
    .limit(limit)
    .skip(skip)
    .populate('userId', 'firstName lastName email');
};

// Static method to get public designs
designSchema.statics.getPublicDesigns = function(options: any = {}) {
  const query = { isPublic: true, status: 'completed' };
  const sort = options.sort || { views: -1, createdAt: -1 };
  const limit = options.limit || 20;
  const skip = options.skip || 0;
  
  return this.find(query)
    .sort(sort)
    .limit(limit)
    .skip(skip)
    .populate('userId', 'firstName lastName');
};

// Static method to search designs
designSchema.statics.searchDesigns = function(searchTerm: string, userId?: string, options: any = {}) {
  const query: any = {
    $text: { $search: searchTerm }
  };
  
  // If userId provided, include user's private designs and public designs
  if (userId) {
    query.$or = [
      { userId, isPublic: false },
      { isPublic: true },
      { 'sharedWith.userId': userId }
    ];
  } else {
    // Only public designs for anonymous users
    query.isPublic = true;
  }
  
  query.status = 'completed';
  
  const sort = options.sort || { score: { $meta: 'textScore' }, views: -1 };
  const limit = options.limit || 20;
  const skip = options.skip || 0;
  
  return this.find(query, { score: { $meta: 'textScore' } })
    .sort(sort)
    .limit(limit)
    .skip(skip)
    .populate('userId', 'firstName lastName');
};

// Static method to get design statistics
designSchema.statics.getStatistics = async function() {
  const totalDesigns = await this.countDocuments();
  const publicDesigns = await this.countDocuments({ isPublic: true });
  const completedDesigns = await this.countDocuments({ status: 'completed' });
  const processingDesigns = await this.countDocuments({ status: 'processing' });
  
  const recentDesigns = await this.countDocuments({
    createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Last 30 days
  });
  
  const totalViews = await this.aggregate([
    { $group: { _id: null, total: { $sum: '$views' } } }
  ]);
  
  const totalDownloads = await this.aggregate([
    { $group: { _id: null, total: { $sum: '$downloads' } } }
  ]);
  
  return {
    total: totalDesigns,
    public: publicDesigns,
    completed: completedDesigns,
    processing: processingDesigns,
    recent: recentDesigns,
    totalViews: totalViews[0]?.total || 0,
    totalDownloads: totalDownloads[0]?.total || 0
  };
};

// Export the model
export const Design = mongoose.model<IDesign>('Design', designSchema);
export default Design;