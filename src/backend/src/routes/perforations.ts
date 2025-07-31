import express, { Request, Response } from 'express';
import { body, query, validationResult } from 'express-validator';
import { asyncHandler } from '@/middleware/errorHandler';
import { AppError, ValidationError } from '@/middleware/errorHandler';
import { optionalAuth } from '@/middleware/auth';
import { logger } from '@/utils/logger';
import { v4 as uuidv4 } from 'uuid';
import rateLimit from 'express-rate-limit';

const router = express.Router();

// Rate limiting for perforation generation
const perforationLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 50, // 50 requests per window
  message: {
    error: 'Too many perforation generation requests, please try again later',
    retryAfter: 5 * 60
  }
});

// Types for perforation calculations
interface Point {
  x: number;
  y: number;
}

interface Perforation {
  id: string;
  position: Point;
  size: number;
  shape: string;
  rotation?: number;
}

interface PanelDimensions {
  width: number;
  height: number;
  units: 'inches';
}

interface PerforationSettings {
  minSize: number;
  maxSize: number;
  shape: 'circle' | 'square' | 'rectangle' | 'hexagon' | 'triangle' | 'custom';
  pattern: 'grid' | 'staggered' | 'random' | 'radial' | 'custom';
  spacing: {
    horizontal: number;
    vertical: number;
    diagonal?: number;
  };
  rotation?: number;
  customShape?: string; // SVG path for custom shapes
}

interface ImageAnalysis {
  width: number;
  height: number;
  statistics: {
    mean: number;
    min: number;
    max: number;
    stdDev: number;
    contrast: number;
    histogram: number[];
  };
}

// Helper function to convert inches to pixels (assuming 300 DPI)
const inchesToPixels = (inches: number, dpi: number = 300): number => {
  return inches * dpi;
};

// Helper function to convert pixels to inches
const pixelsToInches = (pixels: number, dpi: number = 300): number => {
  return pixels / dpi;
};

// Helper function to map grayscale value to perforation size
const mapGrayscaleToSize = (grayscaleValue: number, minSize: number, maxSize: number, invert: boolean = false): number => {
  // Normalize grayscale value (0-255) to 0-1
  const normalized = grayscaleValue / 255;
  
  // Invert if needed (darker areas = larger holes)
  const mappedValue = invert ? (1 - normalized) : normalized;
  
  // Map to size range
  return minSize + (mappedValue * (maxSize - minSize));
};

// Helper function to generate grid pattern
const generateGridPattern = (
  panelDimensions: PanelDimensions,
  settings: PerforationSettings,
  imageAnalysis?: ImageAnalysis
): Perforation[] => {
  const perforations: Perforation[] = [];
  const { width, height } = panelDimensions;
  const { spacing, minSize, maxSize, shape, rotation = 0 } = settings;
  
  // Convert panel dimensions to pixels for calculation
  const panelWidthPx = inchesToPixels(width);
  const panelHeightPx = inchesToPixels(height);
  
  // Calculate spacing in pixels
  const hSpacingPx = inchesToPixels(spacing.horizontal);
  const vSpacingPx = inchesToPixels(spacing.vertical);
  
  // Calculate number of holes
  const cols = Math.floor(panelWidthPx / hSpacingPx);
  const rows = Math.floor(panelHeightPx / vSpacingPx);
  
  // Calculate starting offsets to center the pattern
  const startX = (panelWidthPx - (cols - 1) * hSpacingPx) / 2;
  const startY = (panelHeightPx - (rows - 1) * vSpacingPx) / 2;
  
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const x = startX + col * hSpacingPx;
      const y = startY + row * vSpacingPx;
      
      // Convert back to inches for final position
      const xInches = pixelsToInches(x);
      const yInches = pixelsToInches(y);
      
      // Determine size based on image analysis if available
      let size = (minSize + maxSize) / 2; // Default to average size
      
      if (imageAnalysis) {
        // Map position to image coordinates
        const imgX = Math.floor((x / panelWidthPx) * imageAnalysis.width);
        const imgY = Math.floor((y / panelHeightPx) * imageAnalysis.height);
        
        // Get grayscale value from histogram (simplified)
        const grayscaleValue = imageAnalysis.statistics.mean; // Simplified - would need actual pixel data
        size = mapGrayscaleToSize(grayscaleValue, minSize, maxSize, true);
      }
      
      perforations.push({
        id: uuidv4(),
        position: { x: xInches, y: yInches },
        size,
        shape,
        rotation
      });
    }
  }
  
  return perforations;
};

// Helper function to generate staggered pattern
const generateStaggeredPattern = (
  panelDimensions: PanelDimensions,
  settings: PerforationSettings,
  imageAnalysis?: ImageAnalysis
): Perforation[] => {
  const perforations: Perforation[] = [];
  const { width, height } = panelDimensions;
  const { spacing, minSize, maxSize, shape, rotation = 0 } = settings;
  
  const panelWidthPx = inchesToPixels(width);
  const panelHeightPx = inchesToPixels(height);
  
  const hSpacingPx = inchesToPixels(spacing.horizontal);
  const vSpacingPx = inchesToPixels(spacing.vertical);
  
  const cols = Math.floor(panelWidthPx / hSpacingPx);
  const rows = Math.floor(panelHeightPx / vSpacingPx);
  
  const startX = (panelWidthPx - (cols - 1) * hSpacingPx) / 2;
  const startY = (panelHeightPx - (rows - 1) * vSpacingPx) / 2;
  
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      // Offset every other row
      const offsetX = (row % 2) * (hSpacingPx / 2);
      const x = startX + col * hSpacingPx + offsetX;
      const y = startY + row * vSpacingPx;
      
      // Skip if outside panel bounds
      if (x < 0 || x > panelWidthPx) continue;
      
      const xInches = pixelsToInches(x);
      const yInches = pixelsToInches(y);
      
      let size = (minSize + maxSize) / 2;
      
      if (imageAnalysis) {
        const imgX = Math.floor((x / panelWidthPx) * imageAnalysis.width);
        const imgY = Math.floor((y / panelHeightPx) * imageAnalysis.height);
        const grayscaleValue = imageAnalysis.statistics.mean;
        size = mapGrayscaleToSize(grayscaleValue, minSize, maxSize, true);
      }
      
      perforations.push({
        id: uuidv4(),
        position: { x: xInches, y: yInches },
        size,
        shape,
        rotation
      });
    }
  }
  
  return perforations;
};

// Helper function to generate random pattern
const generateRandomPattern = (
  panelDimensions: PanelDimensions,
  settings: PerforationSettings,
  imageAnalysis?: ImageAnalysis,
  density: number = 0.7
): Perforation[] => {
  const perforations: Perforation[] = [];
  const { width, height } = panelDimensions;
  const { spacing, minSize, maxSize, shape, rotation = 0 } = settings;
  
  // Calculate approximate number of holes based on grid pattern
  const gridPerforations = generateGridPattern(panelDimensions, settings, imageAnalysis);
  const targetCount = Math.floor(gridPerforations.length * density);
  
  // Generate random positions
  for (let i = 0; i < targetCount; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    
    let size = minSize + Math.random() * (maxSize - minSize);
    
    if (imageAnalysis) {
      const imgX = Math.floor((x / width) * imageAnalysis.width);
      const imgY = Math.floor((y / height) * imageAnalysis.height);
      const grayscaleValue = imageAnalysis.statistics.mean;
      size = mapGrayscaleToSize(grayscaleValue, minSize, maxSize, true);
    }
    
    perforations.push({
      id: uuidv4(),
      position: { x, y },
      size,
      shape,
      rotation: rotation + (Math.random() - 0.5) * 30 // Add some random rotation variation
    });
  }
  
  return perforations;
};

// Helper function to generate radial pattern
const generateRadialPattern = (
  panelDimensions: PanelDimensions,
  settings: PerforationSettings,
  imageAnalysis?: ImageAnalysis
): Perforation[] => {
  const perforations: Perforation[] = [];
  const { width, height } = panelDimensions;
  const { spacing, minSize, maxSize, shape, rotation = 0 } = settings;
  
  const centerX = width / 2;
  const centerY = height / 2;
  const maxRadius = Math.min(width, height) / 2;
  
  const radialSpacing = spacing.horizontal;
  const angularSpacing = spacing.vertical * 10; // Convert to degrees
  
  const rings = Math.floor(maxRadius / radialSpacing);
  
  for (let ring = 1; ring <= rings; ring++) {
    const radius = ring * radialSpacing;
    const circumference = 2 * Math.PI * radius;
    const holesInRing = Math.floor(circumference / (angularSpacing * Math.PI / 180));
    
    for (let i = 0; i < holesInRing; i++) {
      const angle = (i / holesInRing) * 2 * Math.PI;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
      
      // Skip if outside panel bounds
      if (x < 0 || x > width || y < 0 || y > height) continue;
      
      let size = (minSize + maxSize) / 2;
      
      if (imageAnalysis) {
        const imgX = Math.floor((x / width) * imageAnalysis.width);
        const imgY = Math.floor((y / height) * imageAnalysis.height);
        const grayscaleValue = imageAnalysis.statistics.mean;
        size = mapGrayscaleToSize(grayscaleValue, minSize, maxSize, true);
      }
      
      perforations.push({
        id: uuidv4(),
        position: { x, y },
        size,
        shape,
        rotation: rotation + (angle * 180 / Math.PI) // Align with radial direction
      });
    }
  }
  
  return perforations;
};

// Main function to generate perforations
const generatePerforations = (
  panelDimensions: PanelDimensions,
  settings: PerforationSettings,
  imageAnalysis?: ImageAnalysis
): Perforation[] => {
  switch (settings.pattern) {
    case 'grid':
      return generateGridPattern(panelDimensions, settings, imageAnalysis);
    case 'staggered':
      return generateStaggeredPattern(panelDimensions, settings, imageAnalysis);
    case 'random':
      return generateRandomPattern(panelDimensions, settings, imageAnalysis);
    case 'radial':
      return generateRadialPattern(panelDimensions, settings, imageAnalysis);
    default:
      throw new ValidationError(`Unsupported pattern: ${settings.pattern}`);
  }
};

// Helper function to calculate pattern statistics
const calculateStatistics = (perforations: Perforation[], panelDimensions: PanelDimensions) => {
  const totalArea = panelDimensions.width * panelDimensions.height;
  
  let totalPerforationArea = 0;
  let minSize = Infinity;
  let maxSize = 0;
  let totalSize = 0;
  
  perforations.forEach(perf => {
    let area = 0;
    
    switch (perf.shape) {
      case 'circle':
        area = Math.PI * Math.pow(perf.size / 2, 2);
        break;
      case 'square':
        area = Math.pow(perf.size, 2);
        break;
      case 'rectangle':
        area = perf.size * perf.size * 0.75; // Assuming 4:3 ratio
        break;
      case 'hexagon':
        area = (3 * Math.sqrt(3) / 2) * Math.pow(perf.size / 2, 2);
        break;
      case 'triangle':
        area = (Math.sqrt(3) / 4) * Math.pow(perf.size, 2);
        break;
      default:
        area = Math.PI * Math.pow(perf.size / 2, 2); // Default to circle
    }
    
    totalPerforationArea += area;
    minSize = Math.min(minSize, perf.size);
    maxSize = Math.max(maxSize, perf.size);
    totalSize += perf.size;
  });
  
  const averageSize = totalSize / perforations.length;
  const coverage = (totalPerforationArea / totalArea) * 100;
  
  return {
    totalPerforations: perforations.length,
    totalArea: totalArea,
    totalPerforationArea: totalPerforationArea,
    coverage: Math.round(coverage * 100) / 100,
    averageSize: Math.round(averageSize * 1000) / 1000,
    minSize: Math.round(minSize * 1000) / 1000,
    maxSize: Math.round(maxSize * 1000) / 1000,
    density: Math.round((perforations.length / totalArea) * 100) / 100
  };
};

/**
 * @route   POST /api/perforations/generate
 * @desc    Generate perforation pattern
 * @access  Public (with rate limiting)
 */
router.post('/generate', perforationLimiter, optionalAuth, [
  body('panelDimensions').isObject().withMessage('Panel dimensions are required'),
  body('panelDimensions.width').isFloat({ min: 1, max: 120 }).withMessage('Panel width must be between 1 and 120 inches'),
  body('panelDimensions.height').isFloat({ min: 1, max: 120 }).withMessage('Panel height must be between 1 and 120 inches'),
  body('settings').isObject().withMessage('Perforation settings are required'),
  body('settings.minSize').isFloat({ min: 0.0625, max: 6 }).withMessage('Minimum size must be between 1/16 and 6 inches'),
  body('settings.maxSize').isFloat({ min: 0.0625, max: 6 }).withMessage('Maximum size must be between 1/16 and 6 inches'),
  body('settings.shape').isIn(['circle', 'square', 'rectangle', 'hexagon', 'triangle', 'custom']).withMessage('Invalid shape'),
  body('settings.pattern').isIn(['grid', 'staggered', 'random', 'radial', 'custom']).withMessage('Invalid pattern'),
  body('settings.spacing').isObject().withMessage('Spacing settings are required'),
  body('settings.spacing.horizontal').isFloat({ min: 0.125, max: 12 }).withMessage('Horizontal spacing must be between 1/8 and 12 inches'),
  body('settings.spacing.vertical').isFloat({ min: 0.125, max: 12 }).withMessage('Vertical spacing must be between 1/8 and 12 inches')
], asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError('Validation failed', errors.array());
  }
  
  const { panelDimensions, settings, imageAnalysis } = req.body;
  
  // Validate that maxSize >= minSize
  if (settings.maxSize < settings.minSize) {
    throw new ValidationError('Maximum size must be greater than or equal to minimum size');
  }
  
  logger.info('Perforation generation started', {
    panelDimensions,
    settings,
    hasImageAnalysis: !!imageAnalysis,
    userId: req.user?.id
  });
  
  try {
    const perforations = generatePerforations(panelDimensions, settings, imageAnalysis);
    const statistics = calculateStatistics(perforations, panelDimensions);
    
    const result = {
      id: uuidv4(),
      panelDimensions,
      settings,
      perforations,
      statistics,
      generatedAt: new Date().toISOString()
    };
    
    logger.info('Perforation generation completed', {
      patternId: result.id,
      totalPerforations: statistics.totalPerforations,
      coverage: statistics.coverage,
      userId: req.user?.id
    });
    
    res.json({
      success: true,
      message: 'Perforation pattern generated successfully',
      data: result
    });
  } catch (error) {
    logger.error('Perforation generation failed', error as Error, {
      panelDimensions,
      settings,
      userId: req.user?.id
    });
    throw error;
  }
}));

/**
 * @route   GET /api/perforations/shapes
 * @desc    Get available perforation shapes
 * @access  Public
 */
router.get('/shapes', asyncHandler(async (req: Request, res: Response) => {
  const shapes = [
    {
      id: 'circle',
      name: 'Circle',
      description: 'Standard circular perforations',
      parameters: ['diameter'],
      areaFormula: 'π × (d/2)²',
      recommended: true
    },
    {
      id: 'square',
      name: 'Square',
      description: 'Square perforations',
      parameters: ['side length'],
      areaFormula: 's²',
      recommended: true
    },
    {
      id: 'rectangle',
      name: 'Rectangle',
      description: 'Rectangular perforations',
      parameters: ['width', 'height'],
      areaFormula: 'w × h',
      recommended: false
    },
    {
      id: 'hexagon',
      name: 'Hexagon',
      description: 'Hexagonal perforations',
      parameters: ['diameter'],
      areaFormula: '(3√3/2) × (d/2)²',
      recommended: false
    },
    {
      id: 'triangle',
      name: 'Triangle',
      description: 'Triangular perforations',
      parameters: ['side length'],
      areaFormula: '(√3/4) × s²',
      recommended: false
    },
    {
      id: 'custom',
      name: 'Custom',
      description: 'User-defined vector shape',
      parameters: ['SVG path'],
      areaFormula: 'calculated from path',
      recommended: false,
      note: 'Requires SVG path definition'
    }
  ];
  
  res.json({
    success: true,
    data: shapes
  });
}));

/**
 * @route   GET /api/perforations/patterns
 * @desc    Get available perforation patterns
 * @access  Public
 */
router.get('/patterns', asyncHandler(async (req: Request, res: Response) => {
  const patterns = [
    {
      id: 'grid',
      name: 'Grid',
      description: 'Regular grid pattern with uniform spacing',
      parameters: ['horizontal spacing', 'vertical spacing'],
      recommended: true,
      efficiency: 'high'
    },
    {
      id: 'staggered',
      name: 'Staggered',
      description: 'Offset grid pattern for higher density',
      parameters: ['horizontal spacing', 'vertical spacing'],
      recommended: true,
      efficiency: 'very high'
    },
    {
      id: 'random',
      name: 'Random',
      description: 'Randomly distributed perforations',
      parameters: ['density', 'minimum distance'],
      recommended: false,
      efficiency: 'medium'
    },
    {
      id: 'radial',
      name: 'Radial',
      description: 'Circular pattern radiating from center',
      parameters: ['radial spacing', 'angular spacing'],
      recommended: false,
      efficiency: 'medium'
    },
    {
      id: 'custom',
      name: 'Custom',
      description: 'User-defined pattern',
      parameters: ['pattern definition'],
      recommended: false,
      efficiency: 'variable'
    }
  ];
  
  res.json({
    success: true,
    data: patterns
  });
}));

/**
 * @route   POST /api/perforations/calculate
 * @desc    Calculate perforation statistics without generating full pattern
 * @access  Public
 */
router.post('/calculate', [
  body('panelDimensions').isObject().withMessage('Panel dimensions are required'),
  body('settings').isObject().withMessage('Perforation settings are required')
], asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError('Validation failed', errors.array());
  }
  
  const { panelDimensions, settings } = req.body;
  
  try {
    // Generate a small sample to estimate statistics
    const sampleSettings = {
      ...settings,
      spacing: {
        horizontal: Math.min(settings.spacing.horizontal, 1),
        vertical: Math.min(settings.spacing.vertical, 1)
      }
    };
    
    const sampleDimensions = {
      ...panelDimensions,
      width: Math.min(panelDimensions.width, 6),
      height: Math.min(panelDimensions.height, 6)
    };
    
    const samplePerforations = generatePerforations(sampleDimensions, sampleSettings);
    const sampleStats = calculateStatistics(samplePerforations, sampleDimensions);
    
    // Scale up to full panel
    const scaleFactor = (panelDimensions.width * panelDimensions.height) / (sampleDimensions.width * sampleDimensions.height);
    const spacingFactor = (settings.spacing.horizontal * settings.spacing.vertical) / (sampleSettings.spacing.horizontal * sampleSettings.spacing.vertical);
    
    const estimatedStats = {
      estimatedPerforations: Math.round(sampleStats.totalPerforations * scaleFactor / spacingFactor),
      estimatedCoverage: sampleStats.coverage,
      averageSize: sampleStats.averageSize,
      density: sampleStats.density / spacingFactor,
      panelArea: panelDimensions.width * panelDimensions.height
    };
    
    res.json({
      success: true,
      message: 'Statistics calculated successfully',
      data: estimatedStats
    });
  } catch (error) {
    logger.error('Statistics calculation failed', error as Error, {
      panelDimensions,
      settings
    });
    throw error;
  }
}));

/**
 * @route   GET /api/perforations/recommendations
 * @desc    Get recommendations based on panel size and image analysis
 * @access  Public
 */
router.get('/recommendations', [
  query('width').isFloat({ min: 1, max: 120 }).withMessage('Panel width must be between 1 and 120 inches'),
  query('height').isFloat({ min: 1, max: 120 }).withMessage('Panel height must be between 1 and 120 inches')
], asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError('Validation failed', errors.array());
  }
  
  const { width, height, imageContrast, imageComplexity } = req.query;
  
  const panelWidth = Number(width);
  const panelHeight = Number(height);
  const contrast = Number(imageContrast) || 128;
  const complexity = String(imageComplexity) || 'medium';
  
  // Generate recommendations based on panel size and image characteristics
  const recommendations = {
    perforationSize: {
      min: Math.max(0.0625, Math.min(panelWidth, panelHeight) * 0.01),
      max: Math.min(2.0, Math.min(panelWidth, panelHeight) * 0.1),
      recommended: Math.min(0.5, Math.min(panelWidth, panelHeight) * 0.05)
    },
    spacing: {
      horizontal: Math.min(1.0, Math.min(panelWidth, panelHeight) * 0.08),
      vertical: Math.min(1.0, Math.min(panelWidth, panelHeight) * 0.08)
    },
    pattern: contrast > 150 ? 'staggered' : 'grid',
    shape: complexity === 'high' ? 'circle' : 'square',
    estimatedHoles: Math.floor((panelWidth * panelHeight) / 0.64), // Rough estimate
    coverage: contrast > 150 ? '25-35%' : '15-25%'
  };
  
  res.json({
    success: true,
    data: recommendations
  });
}));

export default router;