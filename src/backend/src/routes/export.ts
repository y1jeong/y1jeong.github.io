import express, { Request, Response } from 'express';
import { body, query, param, validationResult } from 'express-validator';
import { optionalAuth } from '@/middleware/auth';
import { asyncHandler } from '@/middleware/errorHandler';
import { AppError, ValidationError } from '@/middleware/errorHandler';
import { logger } from '@/utils/logger';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs/promises';
import rateLimit from 'express-rate-limit';

// Import file generation libraries
import { DxfWriter, point3d } from 'dxf-writer';
import { SVG } from '@svgdotjs/svg.js';
import jsPDF from 'jspdf';

const router = express.Router();

// Rate limiting for export operations
const exportLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 20, // 20 exports per window
  message: {
    error: 'Too many export requests, please try again later',
    retryAfter: 10 * 60
  }
});

// Types for export operations
interface ExportSettings {
  format: 'dxf' | 'svg' | 'pdf';
  units: 'inches' | 'mm';
  scale: number;
  includeOutline: boolean;
  includeDimensions: boolean;
  layerSettings?: {
    outlineLayer?: string;
    perforationLayer?: string;
    dimensionLayer?: string;
  };
  pdfSettings?: {
    pageSize: 'A4' | 'A3' | 'Letter' | 'Tabloid' | 'custom';
    orientation: 'portrait' | 'landscape';
    margin: number;
  };
}

interface Perforation {
  id: string;
  position: { x: number; y: number };
  size: number;
  shape: string;
  rotation?: number;
}

interface PanelData {
  dimensions: { width: number; height: number };
  perforations: Perforation[];
  settings: ExportSettings;
}

// Helper function to convert inches to mm
const inchesToMm = (inches: number): number => inches * 25.4;

// Helper function to convert units based on settings
const convertUnits = (value: number, settings: ExportSettings): number => {
  return settings.units === 'mm' ? inchesToMm(value) : value;
};

// Helper function to ensure export directories exist
const ensureExportDirs = async () => {
  const dirs = [
    path.join(process.cwd(), 'exports'),
    path.join(process.cwd(), 'exports', 'dxf'),
    path.join(process.cwd(), 'exports', 'svg'),
    path.join(process.cwd(), 'exports', 'pdf'),
    path.join(process.cwd(), 'exports', 'temp')
  ];
  
  for (const dir of dirs) {
    try {
      await fs.access(dir);
    } catch {
      await fs.mkdir(dir, { recursive: true });
      logger.info('Created export directory', { directory: dir });
    }
  }
};

// Initialize export directories
ensureExportDirs().catch(error => {
  logger.error('Failed to create export directories', error);
});

// Helper function to generate DXF file
const generateDXF = async (panelData: PanelData): Promise<string> => {
  const { dimensions, perforations, settings } = panelData;
  const dxf = new DxfWriter();
  
  // Convert dimensions
  const width = convertUnits(dimensions.width, settings);
  const height = convertUnits(dimensions.height, settings);
  
  // Set up layers
  const outlineLayer = settings.layerSettings?.outlineLayer || 'OUTLINE';
  const perforationLayer = settings.layerSettings?.perforationLayer || 'PERFORATIONS';
  const dimensionLayer = settings.layerSettings?.dimensionLayer || 'DIMENSIONS';
  
  dxf.addLayer(outlineLayer, DxfWriter.ACI.RED, 'CONTINUOUS');
  dxf.addLayer(perforationLayer, DxfWriter.ACI.BLUE, 'CONTINUOUS');
  dxf.addLayer(dimensionLayer, DxfWriter.ACI.GREEN, 'CONTINUOUS');
  
  // Add panel outline if requested
  if (settings.includeOutline) {
    dxf.setCurrentLayer(outlineLayer);
    dxf.addLine(point3d(0, 0), point3d(width, 0));
    dxf.addLine(point3d(width, 0), point3d(width, height));
    dxf.addLine(point3d(width, height), point3d(0, height));
    dxf.addLine(point3d(0, height), point3d(0, 0));
  }
  
  // Add perforations
  dxf.setCurrentLayer(perforationLayer);
  
  perforations.forEach(perf => {
    const x = convertUnits(perf.position.x, settings);
    const y = convertUnits(perf.position.y, settings);
    const size = convertUnits(perf.size, settings);
    
    switch (perf.shape) {
      case 'circle':
        dxf.addCircle(point3d(x, y), size / 2);
        break;
      
      case 'square':
      case 'rectangle':
        const halfSize = size / 2;
        const corners = [
          point3d(x - halfSize, y - halfSize),
          point3d(x + halfSize, y - halfSize),
          point3d(x + halfSize, y + halfSize),
          point3d(x - halfSize, y + halfSize)
        ];
        
        for (let i = 0; i < corners.length; i++) {
          const start = corners[i];
          const end = corners[(i + 1) % corners.length];
          dxf.addLine(start, end);
        }
        break;
      
      case 'hexagon':
        const radius = size / 2;
        const hexCorners = [];
        
        for (let i = 0; i < 6; i++) {
          const angle = (i * Math.PI) / 3;
          hexCorners.push(point3d(
            x + radius * Math.cos(angle),
            y + radius * Math.sin(angle)
          ));
        }
        
        for (let i = 0; i < hexCorners.length; i++) {
          const start = hexCorners[i];
          const end = hexCorners[(i + 1) % hexCorners.length];
          dxf.addLine(start, end);
        }
        break;
      
      default:
        // Default to circle for unknown shapes
        dxf.addCircle(point3d(x, y), size / 2);
    }
  });
  
  // Add dimensions if requested
  if (settings.includeDimensions) {
    dxf.setCurrentLayer(dimensionLayer);
    
    // Add dimension lines (simplified)
    const dimOffset = convertUnits(0.5, settings);
    
    // Width dimension
    dxf.addLine(
      point3d(0, -dimOffset),
      point3d(width, -dimOffset)
    );
    
    // Height dimension
    dxf.addLine(
      point3d(-dimOffset, 0),
      point3d(-dimOffset, height)
    );
    
    // Add dimension text
    const unitLabel = settings.units === 'mm' ? 'mm' : '"';
    dxf.addText(
      point3d(width / 2, -dimOffset - convertUnits(0.2, settings)),
      convertUnits(0.125, settings),
      `${width.toFixed(2)}${unitLabel}`,
      0
    );
    
    dxf.addText(
      point3d(-dimOffset - convertUnits(0.5, settings), height / 2),
      convertUnits(0.125, settings),
      `${height.toFixed(2)}${unitLabel}`,
      90
    );
  }
  
  return dxf.toDxfString();
};

// Helper function to generate SVG file
const generateSVG = async (panelData: PanelData): Promise<string> => {
  const { dimensions, perforations, settings } = panelData;
  
  // Convert dimensions (SVG uses pixels, so we'll use a scale factor)
  const scaleFactor = settings.units === 'mm' ? 3.78 : 96; // 96 DPI for inches, ~3.78 for mm
  const width = dimensions.width * scaleFactor;
  const height = dimensions.height * scaleFactor;
  
  // Create SVG document
  const svg = SVG().size(width, height).viewbox(0, 0, width, height);
  
  // Add background
  svg.rect(width, height).fill('white').stroke({ color: 'black', width: 1 });
  
  // Add panel outline if requested
  if (settings.includeOutline) {
    svg.rect(width, height)
      .fill('none')
      .stroke({ color: 'red', width: 2 })
      .addClass('panel-outline');
  }
  
  // Add perforations
  const perforationGroup = svg.group().addClass('perforations');
  
  perforations.forEach(perf => {
    const x = perf.position.x * scaleFactor;
    const y = perf.position.y * scaleFactor;
    const size = perf.size * scaleFactor;
    
    let element;
    
    switch (perf.shape) {
      case 'circle':
        element = perforationGroup.circle(size)
          .center(x, y)
          .fill('white')
          .stroke({ color: 'blue', width: 1 });
        break;
      
      case 'square':
        element = perforationGroup.rect(size, size)
          .center(x, y)
          .fill('white')
          .stroke({ color: 'blue', width: 1 });
        break;
      
      case 'rectangle':
        const rectWidth = size;
        const rectHeight = size * 0.75;
        element = perforationGroup.rect(rectWidth, rectHeight)
          .center(x, y)
          .fill('white')
          .stroke({ color: 'blue', width: 1 });
        break;
      
      case 'hexagon':
        const radius = size / 2;
        const points = [];
        
        for (let i = 0; i < 6; i++) {
          const angle = (i * Math.PI) / 3;
          points.push([
            x + radius * Math.cos(angle),
            y + radius * Math.sin(angle)
          ]);
        }
        
        element = perforationGroup.polygon(points)
          .fill('white')
          .stroke({ color: 'blue', width: 1 });
        break;
      
      default:
        element = perforationGroup.circle(size)
          .center(x, y)
          .fill('white')
          .stroke({ color: 'blue', width: 1 });
    }
    
    // Apply rotation if specified
    if (perf.rotation) {
      element.rotate(perf.rotation, x, y);
    }
  });
  
  // Add dimensions if requested
  if (settings.includeDimensions) {
    const dimGroup = svg.group().addClass('dimensions');
    const unitLabel = settings.units === 'mm' ? 'mm' : '"';
    
    // Width dimension
    const widthValue = settings.units === 'mm' ? inchesToMm(dimensions.width) : dimensions.width;
    dimGroup.text(`${widthValue.toFixed(2)}${unitLabel}`)
      .move(width / 2, height + 20)
      .font({ size: 12, anchor: 'middle' })
      .fill('green');
    
    // Height dimension
    const heightValue = settings.units === 'mm' ? inchesToMm(dimensions.height) : dimensions.height;
    dimGroup.text(`${heightValue.toFixed(2)}${unitLabel}`)
      .move(-30, height / 2)
      .font({ size: 12, anchor: 'middle' })
      .fill('green')
      .rotate(-90);
  }
  
  return svg.svg();
};

// Helper function to generate PDF file
const generatePDF = async (panelData: PanelData): Promise<Buffer> => {
  const { dimensions, perforations, settings } = panelData;
  const pdfSettings = settings.pdfSettings || {
    pageSize: 'Letter',
    orientation: 'landscape',
    margin: 0.5
  };
  
  // Create PDF document
  const pdf = new jsPDF({
    orientation: pdfSettings.orientation,
    unit: settings.units === 'mm' ? 'mm' : 'in',
    format: pdfSettings.pageSize === 'custom' ? [dimensions.width + 2, dimensions.height + 2] : pdfSettings.pageSize
  });
  
  // Get page dimensions
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = pdfSettings.margin;
  
  // Calculate scale to fit panel on page
  const availableWidth = pageWidth - (2 * margin);
  const availableHeight = pageHeight - (2 * margin);
  const panelWidth = convertUnits(dimensions.width, settings);
  const panelHeight = convertUnits(dimensions.height, settings);
  
  const scaleX = availableWidth / panelWidth;
  const scaleY = availableHeight / panelHeight;
  const scale = Math.min(scaleX, scaleY, 1); // Don't scale up
  
  const scaledWidth = panelWidth * scale;
  const scaledHeight = panelHeight * scale;
  
  // Center the panel on the page
  const offsetX = margin + (availableWidth - scaledWidth) / 2;
  const offsetY = margin + (availableHeight - scaledHeight) / 2;
  
  // Add title
  pdf.setFontSize(16);
  pdf.text('Perforated Panel Design', pageWidth / 2, margin / 2, { align: 'center' });
  
  // Add panel outline if requested
  if (settings.includeOutline) {
    pdf.setDrawColor(255, 0, 0); // Red
    pdf.setLineWidth(0.5);
    pdf.rect(offsetX, offsetY, scaledWidth, scaledHeight);
  }
  
  // Add perforations
  pdf.setDrawColor(0, 0, 255); // Blue
  pdf.setFillColor(255, 255, 255); // White fill
  pdf.setLineWidth(0.1);
  
  perforations.forEach(perf => {
    const x = offsetX + (convertUnits(perf.position.x, settings) * scale);
    const y = offsetY + (convertUnits(perf.position.y, settings) * scale);
    const size = convertUnits(perf.size, settings) * scale;
    
    switch (perf.shape) {
      case 'circle':
        pdf.circle(x, y, size / 2, 'FD');
        break;
      
      case 'square':
      case 'rectangle':
        const rectSize = size;
        pdf.rect(x - rectSize / 2, y - rectSize / 2, rectSize, rectSize, 'FD');
        break;
      
      default:
        pdf.circle(x, y, size / 2, 'FD');
    }
  });
  
  // Add dimensions if requested
  if (settings.includeDimensions) {
    pdf.setTextColor(0, 128, 0); // Green
    pdf.setFontSize(10);
    
    const unitLabel = settings.units === 'mm' ? 'mm' : '"';
    const widthValue = convertUnits(dimensions.width, settings);
    const heightValue = convertUnits(dimensions.height, settings);
    
    // Width dimension
    pdf.text(
      `Width: ${widthValue.toFixed(2)}${unitLabel}`,
      offsetX + scaledWidth / 2,
      offsetY + scaledHeight + margin / 4,
      { align: 'center' }
    );
    
    // Height dimension
    pdf.text(
      `Height: ${heightValue.toFixed(2)}${unitLabel}`,
      offsetX - margin / 4,
      offsetY + scaledHeight / 2,
      { align: 'center', angle: 90 }
    );
  }
  
  // Add metadata
  pdf.setFontSize(8);
  pdf.setTextColor(128, 128, 128); // Gray
  const metadata = [
    `Generated: ${new Date().toLocaleString()}`,
    `Perforations: ${perforations.length}`,
    `Scale: ${(scale * 100).toFixed(1)}%`
  ];
  
  metadata.forEach((text, index) => {
    pdf.text(text, margin, pageHeight - margin + (index * 3), { align: 'left' });
  });
  
  return Buffer.from(pdf.output('arraybuffer'));
};

// Helper function to generate filename
const generateFilename = (format: string, panelData: PanelData): string => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const width = panelData.dimensions.width;
  const height = panelData.dimensions.height;
  const units = panelData.settings.units;
  
  return `panel_${width}x${height}${units}_${timestamp}.${format}`;
};

/**
 * @route   POST /api/export/generate
 * @desc    Generate export file
 * @access  Public (with rate limiting)
 */
router.post('/generate', exportLimiter, optionalAuth, [
  body('format').isIn(['dxf', 'svg', 'pdf']).withMessage('Format must be dxf, svg, or pdf'),
  body('panelDimensions').isObject().withMessage('Panel dimensions are required'),
  body('panelDimensions.width').isFloat({ min: 1, max: 120 }).withMessage('Panel width must be between 1 and 120 inches'),
  body('panelDimensions.height').isFloat({ min: 1, max: 120 }).withMessage('Panel height must be between 1 and 120 inches'),
  body('perforations').isArray().withMessage('Perforations array is required'),
  body('settings').isObject().withMessage('Export settings are required'),
  body('settings.units').isIn(['inches', 'mm']).withMessage('Units must be inches or mm'),
  body('settings.scale').optional().isFloat({ min: 0.1, max: 10 }).withMessage('Scale must be between 0.1 and 10')
], asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError('Validation failed', errors.array());
  }
  
  const { format, panelDimensions, perforations, settings } = req.body;
  
  const panelData: PanelData = {
    dimensions: panelDimensions,
    perforations,
    settings: {
      format,
      units: settings.units || 'inches',
      scale: settings.scale || 1,
      includeOutline: settings.includeOutline !== false,
      includeDimensions: settings.includeDimensions !== false,
      layerSettings: settings.layerSettings,
      pdfSettings: settings.pdfSettings
    }
  };
  
  logger.info('Export generation started', {
    format,
    panelDimensions,
    perforationCount: perforations.length,
    settings,
    userId: req.user?.id
  });
  
  try {
    let fileContent: string | Buffer;
    let mimeType: string;
    
    switch (format) {
      case 'dxf':
        fileContent = await generateDXF(panelData);
        mimeType = 'application/dxf';
        break;
      
      case 'svg':
        fileContent = await generateSVG(panelData);
        mimeType = 'image/svg+xml';
        break;
      
      case 'pdf':
        fileContent = await generatePDF(panelData);
        mimeType = 'application/pdf';
        break;
      
      default:
        throw new ValidationError(`Unsupported format: ${format}`);
    }
    
    const filename = generateFilename(format, panelData);
    const filepath = path.join(process.cwd(), 'exports', format, filename);
    
    // Save file to disk
    await fs.writeFile(filepath, fileContent);
    
    const result = {
      id: uuidv4(),
      filename,
      format,
      size: Buffer.isBuffer(fileContent) ? fileContent.length : Buffer.byteLength(fileContent),
      downloadUrl: `/api/export/download/${format}/${filename}`,
      settings: panelData.settings,
      statistics: {
        panelArea: panelDimensions.width * panelDimensions.height,
        perforationCount: perforations.length,
        fileSize: Buffer.isBuffer(fileContent) ? fileContent.length : Buffer.byteLength(fileContent)
      },
      generatedAt: new Date().toISOString()
    };
    
    logger.info('Export generation completed', {
      exportId: result.id,
      format,
      filename,
      fileSize: result.size,
      userId: req.user?.id
    });
    
    res.json({
      success: true,
      message: 'Export file generated successfully',
      data: result
    });
  } catch (error) {
    logger.error('Export generation failed', error as Error, {
      format,
      panelDimensions,
      userId: req.user?.id
    });
    throw error;
  }
}));

/**
 * @route   GET /api/export/download/:format/:filename
 * @desc    Download generated export file
 * @access  Public
 */
router.get('/download/:format/:filename', [
  param('format').isIn(['dxf', 'svg', 'pdf']).withMessage('Invalid format'),
  param('filename').matches(/^[a-zA-Z0-9_.-]+$/).withMessage('Invalid filename')
], asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError('Validation failed', errors.array());
  }
  
  const { format, filename } = req.params;
  const filepath = path.join(process.cwd(), 'exports', format, filename);
  
  try {
    // Check if file exists
    await fs.access(filepath);
    
    // Set appropriate headers
    let mimeType: string;
    switch (format) {
      case 'dxf':
        mimeType = 'application/dxf';
        break;
      case 'svg':
        mimeType = 'image/svg+xml';
        break;
      case 'pdf':
        mimeType = 'application/pdf';
        break;
      default:
        mimeType = 'application/octet-stream';
    }
    
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    // Stream file to response
    const fileStream = await fs.readFile(filepath);
    res.send(fileStream);
    
    logger.info('File downloaded', {
      format,
      filename,
      size: fileStream.length
    });
  } catch (error) {
    logger.error('File download failed', error as Error, {
      format,
      filename
    });
    
    if ((error as any).code === 'ENOENT') {
      throw new AppError('File not found', 404);
    }
    throw error;
  }
}));

/**
 * @route   GET /api/export/formats
 * @desc    Get supported export formats and their capabilities
 * @access  Public
 */
router.get('/formats', asyncHandler(async (req: Request, res: Response) => {
  const formats = {
    dxf: {
      name: 'AutoCAD DXF',
      description: 'Industry standard CAD format for CNC machining and laser cutting',
      extension: '.dxf',
      mimeType: 'application/dxf',
      features: [
        'Vector-based geometry',
        'Layer support',
        'Precise dimensions',
        'CAM software compatible',
        'Scalable'
      ],
      limitations: [
        'No raster images',
        'Limited styling options'
      ],
      recommended: true,
      useCases: ['CNC machining', 'Laser cutting', 'Waterjet cutting', 'CAD software']
    },
    svg: {
      name: 'Scalable Vector Graphics',
      description: 'Web-friendly vector format with styling support',
      extension: '.svg',
      mimeType: 'image/svg+xml',
      features: [
        'Vector-based geometry',
        'CSS styling support',
        'Web browser compatible',
        'Scalable',
        'Text support'
      ],
      limitations: [
        'Limited CAM support',
        'May require conversion for manufacturing'
      ],
      recommended: true,
      useCases: ['Web display', 'Print graphics', 'Design visualization', 'Documentation']
    },
    pdf: {
      name: 'Portable Document Format',
      description: 'Universal document format for sharing and printing',
      extension: '.pdf',
      mimeType: 'application/pdf',
      features: [
        'Universal compatibility',
        'Print-ready',
        'Embedded fonts',
        'Metadata support',
        'Security options'
      ],
      limitations: [
        'Not suitable for manufacturing',
        'Raster-based when printed',
        'Limited editability'
      ],
      recommended: false,
      useCases: ['Documentation', 'Presentations', 'Archival', 'Client review']
    }
  };
  
  const settings = {
    units: {
      supported: ['inches', 'mm'],
      default: 'inches',
      description: 'Output units for dimensions and coordinates'
    },
    scale: {
      min: 0.1,
      max: 10.0,
      default: 1.0,
      description: 'Scale factor for output geometry'
    },
    options: {
      includeOutline: {
        default: true,
        description: 'Include panel outline in export'
      },
      includeDimensions: {
        default: true,
        description: 'Include dimension annotations'
      },
      layerSettings: {
        description: 'Custom layer names for DXF export',
        defaults: {
          outlineLayer: 'OUTLINE',
          perforationLayer: 'PERFORATIONS',
          dimensionLayer: 'DIMENSIONS'
        }
      }
    }
  };
  
  res.json({
    success: true,
    data: {
      formats,
      settings,
      recommendations: {
        manufacturing: 'Use DXF format for CNC machining, laser cutting, or waterjet cutting',
        visualization: 'Use SVG format for web display or design documentation',
        documentation: 'Use PDF format for client presentations or archival purposes'
      }
    }
  });
}));

/**
 * @route   POST /api/export/preview
 * @desc    Generate preview of export without creating file
 * @access  Public
 */
router.post('/preview', exportLimiter, optionalAuth, [
  body('format').isIn(['svg']).withMessage('Preview only supports SVG format'),
  body('panelDimensions').isObject().withMessage('Panel dimensions are required'),
  body('perforations').isArray().withMessage('Perforations array is required'),
  body('settings').isObject().withMessage('Export settings are required')
], asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError('Validation failed', errors.array());
  }
  
  const { format, panelDimensions, perforations, settings } = req.body;
  
  if (format !== 'svg') {
    throw new ValidationError('Preview only supports SVG format');
  }
  
  const panelData: PanelData = {
    dimensions: panelDimensions,
    perforations,
    settings: {
      format,
      units: settings.units || 'inches',
      scale: settings.scale || 1,
      includeOutline: settings.includeOutline !== false,
      includeDimensions: settings.includeDimensions !== false
    }
  };
  
  try {
    const svgContent = await generateSVG(panelData);
    
    res.setHeader('Content-Type', 'image/svg+xml');
    res.send(svgContent);
  } catch (error) {
    logger.error('Preview generation failed', error as Error, {
      format,
      panelDimensions,
      userId: req.user?.id
    });
    throw error;
  }
}));

export default router;