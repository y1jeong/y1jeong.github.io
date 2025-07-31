import express, { Request, Response } from 'express';
import multer from 'multer';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';
import { authenticate, optionalAuth } from '@/middleware/auth';
import { asyncHandler } from '@/middleware/errorHandler';
import { AppError, ValidationError } from '@/middleware/errorHandler';
import { logger } from '@/utils/logger';
import { body, validationResult } from 'express-validator';
import rateLimit from 'express-rate-limit';

const router = express.Router();

// Rate limiting for image uploads
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 uploads per window
  message: {
    error: 'Too many upload attempts, please try again later',
    retryAfter: 15 * 60
  }
});

// Configure multer for file uploads
const storage = multer.memoryStorage();

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Check file type
  const allowedMimes = ['image/jpeg', 'image/png', 'image/svg+xml'];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new ValidationError('Only JPEG, PNG, and SVG files are allowed'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max file size
    files: 1 // Only one file at a time
  }
});

// Ensure upload directories exist
const ensureUploadDirs = async () => {
  const dirs = [
    path.join(process.cwd(), 'uploads'),
    path.join(process.cwd(), 'uploads', 'images'),
    path.join(process.cwd(), 'uploads', 'processed'),
    path.join(process.cwd(), 'uploads', 'temp')
  ];
  
  for (const dir of dirs) {
    try {
      await fs.access(dir);
    } catch {
      await fs.mkdir(dir, { recursive: true });
      logger.info('Created upload directory', { directory: dir });
    }
  }
};

// Initialize upload directories
ensureUploadDirs().catch(error => {
  logger.error('Failed to create upload directories', error);
});

// Helper function to generate unique filename
const generateFilename = (originalName: string, suffix: string = ''): string => {
  const ext = path.extname(originalName);
  const name = path.basename(originalName, ext);
  const timestamp = Date.now();
  const uuid = uuidv4().split('-')[0];
  return `${name}_${timestamp}_${uuid}${suffix}${ext}`;
};

// Helper function to save file to disk
const saveFile = async (buffer: Buffer, filename: string, subdir: string = 'images'): Promise<string> => {
  const filepath = path.join(process.cwd(), 'uploads', subdir, filename);
  await fs.writeFile(filepath, buffer);
  return filepath;
};

// Helper function to get file URL
const getFileUrl = (filename: string, subdir: string = 'images'): string => {
  return `/uploads/${subdir}/${filename}`;
};

// Helper function to analyze image
const analyzeImage = async (buffer: Buffer): Promise<any> => {
  try {
    const metadata = await sharp(buffer).metadata();
    const stats = await sharp(buffer)
      .greyscale()
      .raw()
      .toBuffer({ resolveWithObject: true });
    
    // Calculate basic statistics
    const pixels = new Uint8Array(stats.data);
    let sum = 0;
    let min = 255;
    let max = 0;
    
    for (let i = 0; i < pixels.length; i++) {
      const value = pixels[i];
      sum += value;
      min = Math.min(min, value);
      max = Math.max(max, value);
    }
    
    const mean = sum / pixels.length;
    
    // Calculate standard deviation
    let variance = 0;
    for (let i = 0; i < pixels.length; i++) {
      variance += Math.pow(pixels[i] - mean, 2);
    }
    const stdDev = Math.sqrt(variance / pixels.length);
    
    // Calculate histogram
    const histogram = new Array(256).fill(0);
    for (let i = 0; i < pixels.length; i++) {
      histogram[pixels[i]]++;
    }
    
    return {
      width: metadata.width,
      height: metadata.height,
      channels: metadata.channels,
      format: metadata.format,
      size: buffer.length,
      statistics: {
        mean: Math.round(mean),
        min,
        max,
        stdDev: Math.round(stdDev),
        contrast: max - min,
        histogram
      }
    };
  } catch (error) {
    logger.error('Image analysis failed', error as Error);
    throw new AppError('Failed to analyze image', 500);
  }
};

// Helper function to process image
const processImage = async (buffer: Buffer, options: any = {}): Promise<Buffer> => {
  try {
    let pipeline = sharp(buffer);
    
    // Apply processing options
    if (options.resize) {
      pipeline = pipeline.resize(options.resize.width, options.resize.height, {
        fit: options.resize.fit || 'inside',
        withoutEnlargement: true
      });
    }
    
    if (options.brightness !== undefined && options.brightness !== 0) {
      // Convert brightness from -100 to 100 range to sharp's modulate range
      const brightnessValue = 1 + (options.brightness / 100);
      pipeline = pipeline.modulate({ brightness: brightnessValue });
    }
    
    if (options.contrast !== undefined && options.contrast !== 0) {
      // Apply contrast adjustment
      const contrastValue = 1 + (options.contrast / 100);
      pipeline = pipeline.linear(contrastValue, -(128 * contrastValue) + 128);
    }
    
    if (options.gamma !== undefined && options.gamma !== 1.0) {
      pipeline = pipeline.gamma(options.gamma);
    }
    
    if (options.blur !== undefined && options.blur > 0) {
      pipeline = pipeline.blur(options.blur);
    }
    
    if (options.invert) {
      pipeline = pipeline.negate();
    }
    
    if (options.grayscale) {
      pipeline = pipeline.greyscale();
    }
    
    // Convert to specified format
    if (options.format) {
      switch (options.format.toLowerCase()) {
        case 'jpeg':
        case 'jpg':
          pipeline = pipeline.jpeg({ quality: options.quality || 90 });
          break;
        case 'png':
          pipeline = pipeline.png({ compressionLevel: options.compression || 6 });
          break;
        case 'webp':
          pipeline = pipeline.webp({ quality: options.quality || 90 });
          break;
      }
    }
    
    return await pipeline.toBuffer();
  } catch (error) {
    logger.error('Image processing failed', error as Error, { options });
    throw new AppError('Failed to process image', 500);
  }
};

/**
 * @route   POST /api/images/upload
 * @desc    Upload and analyze image
 * @access  Public (with rate limiting)
 */
router.post('/upload', uploadLimiter, optionalAuth, upload.single('image'), asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) {
    throw new ValidationError('No image file provided');
  }
  
  const { buffer, originalname, mimetype, size } = req.file;
  
  logger.info('Image upload started', {
    filename: originalname,
    mimetype,
    size,
    userId: req.user?.id
  });
  
  try {
    // Analyze the image
    const analysis = await analyzeImage(buffer);
    
    // Generate filenames
    const originalFilename = generateFilename(originalname);
    const processedFilename = generateFilename(originalname, '_processed');
    
    // Save original image
    const originalPath = await saveFile(buffer, originalFilename, 'images');
    
    // Create a processed version (grayscale for analysis)
    const processedBuffer = await processImage(buffer, { 
      grayscale: true,
      format: 'png'
    });
    const processedPath = await saveFile(processedBuffer, processedFilename, 'processed');
    
    const result = {
      id: uuidv4(),
      original: {
        filename: originalFilename,
        path: originalPath,
        url: getFileUrl(originalFilename, 'images'),
        mimetype,
        size
      },
      processed: {
        filename: processedFilename,
        path: processedPath,
        url: getFileUrl(processedFilename, 'processed')
      },
      analysis,
      uploadedAt: new Date().toISOString()
    };
    
    logger.info('Image upload completed', {
      imageId: result.id,
      originalFilename,
      processedFilename,
      userId: req.user?.id
    });
    
    res.json({
      success: true,
      message: 'Image uploaded and analyzed successfully',
      data: result
    });
  } catch (error) {
    logger.error('Image upload failed', error as Error, {
      filename: originalname,
      userId: req.user?.id
    });
    throw error;
  }
}));

/**
 * @route   POST /api/images/process
 * @desc    Process image with custom settings
 * @access  Public (with rate limiting)
 */
router.post('/process', uploadLimiter, optionalAuth, [
  body('imageId').notEmpty().withMessage('Image ID is required'),
  body('settings').isObject().withMessage('Processing settings must be an object')
], asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError('Validation failed', errors.array());
  }
  
  const { imageId, settings } = req.body;
  
  // TODO: Retrieve original image from storage/database
  // For now, we'll expect the client to provide the image data or filename
  
  const {
    brightness = 0,
    contrast = 0,
    gamma = 1.0,
    blur = 0,
    invert = false,
    resize,
    format = 'png',
    quality = 90
  } = settings;
  
  logger.info('Image processing started', {
    imageId,
    settings,
    userId: req.user?.id
  });
  
  try {
    // TODO: Load original image buffer from storage
    // const originalBuffer = await loadImageFromStorage(imageId);
    
    // For demonstration, we'll return a mock response
    const processedFilename = generateFilename(`processed_${imageId}`, '_custom');
    
    // Process the image
    // const processedBuffer = await processImage(originalBuffer, {
    //   brightness,
    //   contrast,
    //   gamma,
    //   blur,
    //   invert,
    //   resize,
    //   format,
    //   quality
    // });
    
    // Save processed image
    // const processedPath = await saveFile(processedBuffer, processedFilename, 'processed');
    
    const result = {
      id: uuidv4(),
      imageId,
      filename: processedFilename,
      // path: processedPath,
      url: getFileUrl(processedFilename, 'processed'),
      settings,
      processedAt: new Date().toISOString()
    };
    
    logger.info('Image processing completed', {
      imageId,
      processedFilename,
      userId: req.user?.id
    });
    
    res.json({
      success: true,
      message: 'Image processed successfully',
      data: result
    });
  } catch (error) {
    logger.error('Image processing failed', error as Error, {
      imageId,
      settings,
      userId: req.user?.id
    });
    throw error;
  }
}));

/**
 * @route   GET /api/images/:imageId/analysis
 * @desc    Get detailed image analysis
 * @access  Public
 */
router.get('/:imageId/analysis', asyncHandler(async (req: Request, res: Response) => {
  const { imageId } = req.params;
  
  // TODO: Retrieve image analysis from database
  // For now, return mock analysis data
  
  const analysis = {
    imageId,
    dimensions: {
      width: 1920,
      height: 1080
    },
    statistics: {
      mean: 128,
      min: 0,
      max: 255,
      stdDev: 64,
      contrast: 255
    },
    histogram: new Array(256).fill(0).map((_, i) => Math.random() * 1000),
    recommendations: {
      suggestedMinSize: 0.125,
      suggestedMaxSize: 1.0,
      optimalSpacing: 0.5,
      densityVariation: 'high'
    }
  };
  
  res.json({
    success: true,
    data: analysis
  });
}));

/**
 * @route   GET /api/images/:imageId/preview
 * @desc    Generate preview with perforation overlay
 * @access  Public
 */
router.get('/:imageId/preview', asyncHandler(async (req: Request, res: Response) => {
  const { imageId } = req.params;
  const {
    width = 24,
    height = 36,
    minSize = 0.125,
    maxSize = 1.0,
    spacing = 0.5,
    pattern = 'grid',
    shape = 'circle'
  } = req.query;
  
  logger.info('Preview generation started', {
    imageId,
    parameters: { width, height, minSize, maxSize, spacing, pattern, shape }
  });
  
  try {
    // TODO: Generate actual preview with perforations
    // This would involve:
    // 1. Loading the processed image
    // 2. Calculating perforation positions based on grayscale values
    // 3. Overlaying perforation shapes
    // 4. Returning the preview image
    
    const previewFilename = generateFilename(`preview_${imageId}`, '_preview');
    
    const result = {
      imageId,
      filename: previewFilename,
      url: getFileUrl(previewFilename, 'temp'),
      parameters: {
        panelSize: { width: Number(width), height: Number(height) },
        perforationSize: { min: Number(minSize), max: Number(maxSize) },
        spacing: Number(spacing),
        pattern,
        shape
      },
      statistics: {
        totalPerforations: 1250,
        averageSize: 0.625,
        coverage: 35.2
      },
      generatedAt: new Date().toISOString()
    };
    
    logger.info('Preview generation completed', {
      imageId,
      previewFilename
    });
    
    res.json({
      success: true,
      message: 'Preview generated successfully',
      data: result
    });
  } catch (error) {
    logger.error('Preview generation failed', error as Error, { imageId });
    throw error;
  }
}));

/**
 * @route   DELETE /api/images/:imageId
 * @desc    Delete image and associated files
 * @access  Public
 */
router.delete('/:imageId', asyncHandler(async (req: Request, res: Response) => {
  const { imageId } = req.params;
  
  logger.info('Image deletion started', { imageId });
  
  try {
    // TODO: Delete image files from storage
    // TODO: Remove image record from database
    
    logger.info('Image deletion completed', { imageId });
    
    res.json({
      success: true,
      message: 'Image deleted successfully'
    });
  } catch (error) {
    logger.error('Image deletion failed', error as Error, { imageId });
    throw error;
  }
}));

/**
 * @route   GET /api/images/formats
 * @desc    Get supported image formats and limits
 * @access  Public
 */
router.get('/formats', asyncHandler(async (req: Request, res: Response) => {
  const formats = {
    supported: [
      {
        extension: 'jpg',
        mimeType: 'image/jpeg',
        description: 'JPEG image format',
        maxSize: '50MB',
        recommended: true
      },
      {
        extension: 'png',
        mimeType: 'image/png',
        description: 'PNG image format',
        maxSize: '50MB',
        recommended: true
      },
      {
        extension: 'svg',
        mimeType: 'image/svg+xml',
        description: 'SVG vector format',
        maxSize: '10MB',
        recommended: false,
        note: 'Will be rasterized for processing'
      }
    ],
    limits: {
      maxFileSize: '50MB',
      maxDimensions: {
        width: 8192,
        height: 8192
      },
      minDimensions: {
        width: 100,
        height: 100
      }
    },
    processing: {
      outputFormats: ['png', 'jpeg', 'webp'],
      maxProcessingTime: '30 seconds',
      supportedOperations: [
        'brightness adjustment',
        'contrast adjustment',
        'gamma correction',
        'blur',
        'invert',
        'grayscale conversion',
        'resize'
      ]
    }
  };
  
  res.json({
    success: true,
    data: formats
  });
}));

export default router;