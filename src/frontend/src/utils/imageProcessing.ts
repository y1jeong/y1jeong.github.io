import { PerforationPattern } from '../pages/Design';

interface ImageProcessingOptions {
  minSize: number;
  maxSize: number;
  minSpacing: number;
  maxSpacing: number;
  density: number;
  snapToGrid: boolean;
  gridSize: number;
  threshold: number; // Brightness threshold for perforation placement (0-255)
  invert: boolean; // Whether to invert the image (dark areas = perforations)
}

interface ProcessingResult {
  patterns: PerforationPattern[];
  processedImageData: ImageData;
  statistics: {
    totalPerforations: number;
    averageSize: number;
    coverage: number; // Percentage of area covered by perforations
  };
}

/**
 * Converts an uploaded image to grayscale and extracts brightness data
 */
export const processImageToGrayscale = (imageData: ImageData): number[] => {
  const { data } = imageData;
  const grayscale: number[] = [];
  
  for (let i = 0; i < data.length; i += 4) {
    // Convert RGB to grayscale using luminance formula
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
    grayscale.push(gray);
  }
  
  return grayscale;
};

/**
 * Analyzes image brightness and generates perforation patterns
 */
export const generatePerforationsFromImage = (
  imageData: ImageData,
  canvasWidth: number,
  canvasHeight: number,
  options: ImageProcessingOptions
): ProcessingResult => {
  const { width: imgWidth, height: imgHeight } = imageData;
  const grayscale = processImageToGrayscale(imageData);
  
  const patterns: PerforationPattern[] = [];
  const processedData = new Uint8ClampedArray(imageData.data);
  
  // Calculate scaling factors to fit image to canvas
  const scaleX = canvasWidth / imgWidth;
  const scaleY = canvasHeight / imgHeight;
  const scale = Math.min(scaleX, scaleY);
  
  // Calculate actual image dimensions on canvas
  const scaledWidth = imgWidth * scale;
  const scaledHeight = imgHeight * scale;
  const offsetX = (canvasWidth - scaledWidth) / 2;
  const offsetY = (canvasHeight - scaledHeight) / 2;
  
  // Determine sampling grid based on density and spacing
  const baseSpacing = options.minSpacing + (options.maxSpacing - options.minSpacing) * (1 - options.density / 100);
  const samplingStep = Math.max(1, Math.floor(baseSpacing / scale));
  
  let totalPerforations = 0;
  let totalSize = 0;
  let totalArea = 0;
  
  // Sample the image at regular intervals
  for (let y = 0; y < imgHeight; y += samplingStep) {
    for (let x = 0; x < imgWidth; x += samplingStep) {
      const pixelIndex = y * imgWidth + x;
      const brightness = grayscale[pixelIndex];
      
      // Determine if a perforation should be placed based on brightness threshold
      const shouldPlace = options.invert 
        ? brightness < options.threshold 
        : brightness > options.threshold;
      
      if (shouldPlace) {
        // Calculate perforation size based on brightness
        const normalizedBrightness = options.invert 
          ? (255 - brightness) / 255 
          : brightness / 255;
        
        const size = options.minSize + (options.maxSize - options.minSize) * normalizedBrightness;
        
        // Calculate position on canvas
        let canvasX = offsetX + (x * scale);
        let canvasY = offsetY + (y * scale);
        
        // Apply snap to grid if enabled
        if (options.snapToGrid) {
          canvasX = Math.round(canvasX / options.gridSize) * options.gridSize;
          canvasY = Math.round(canvasY / options.gridSize) * options.gridSize;
        }
        
        // Ensure perforation is within canvas bounds
        if (canvasX >= 0 && canvasX <= canvasWidth && canvasY >= 0 && canvasY <= canvasHeight) {
          const pattern: PerforationPattern = {
            id: `img-pattern-${x}-${y}-${Date.now()}`,
            type: 'circle', // Default to circle for image-based perforations
            size: Math.round(size),
            spacing: baseSpacing,
            rotation: 0,
            x: canvasX,
            y: canvasY,
            selected: false
          };
          
          patterns.push(pattern);
          totalPerforations++;
          totalSize += size;
          totalArea += Math.PI * (size / 2) ** 2;
        }
        
        // Mark processed pixels in the processed image data
        const dataIndex = pixelIndex * 4;
        processedData[dataIndex] = 255; // R
        processedData[dataIndex + 1] = 0; // G
        processedData[dataIndex + 2] = 0; // B
        // Alpha remains unchanged
      }
    }
  }
  
  const processedImageData = new ImageData(processedData, imgWidth, imgHeight);
  const canvasArea = canvasWidth * canvasHeight;
  const coverage = (totalArea / canvasArea) * 100;
  
  return {
    patterns,
    processedImageData,
    statistics: {
      totalPerforations,
      averageSize: totalPerforations > 0 ? totalSize / totalPerforations : 0,
      coverage
    }
  };
};

/**
 * Creates a preview of how the image will be processed
 */
export const createProcessingPreview = (
  imageData: ImageData,
  options: ImageProcessingOptions
): ImageData => {
  const { width, height } = imageData;
  const grayscale = processImageToGrayscale(imageData);
  const previewData = new Uint8ClampedArray(imageData.data.length);
  
  for (let i = 0; i < grayscale.length; i++) {
    const brightness = grayscale[i];
    const shouldPlace = options.invert 
      ? brightness < options.threshold 
      : brightness > options.threshold;
    
    const dataIndex = i * 4;
    if (shouldPlace) {
      // Highlight areas where perforations will be placed
      previewData[dataIndex] = 255; // R
      previewData[dataIndex + 1] = 100; // G
      previewData[dataIndex + 2] = 100; // B
      previewData[dataIndex + 3] = 200; // A
    } else {
      // Show original image with reduced opacity
      previewData[dataIndex] = imageData.data[dataIndex] * 0.5;
      previewData[dataIndex + 1] = imageData.data[dataIndex + 1] * 0.5;
      previewData[dataIndex + 2] = imageData.data[dataIndex + 2] * 0.5;
      previewData[dataIndex + 3] = 128;
    }
  }
  
  return new ImageData(previewData, width, height);
};

/**
 * Analyzes image histogram to suggest optimal threshold values
 */
export const analyzeImageHistogram = (imageData: ImageData) => {
  const grayscale = processImageToGrayscale(imageData);
  const histogram = new Array(256).fill(0);
  
  // Build histogram
  grayscale.forEach(value => {
    histogram[value]++;
  });
  
  // Find peaks and valleys for threshold suggestions
  const totalPixels = grayscale.length;
  let cumulativeSum = 0;
  let median = 0;
  
  for (let i = 0; i < 256; i++) {
    cumulativeSum += histogram[i];
    if (cumulativeSum >= totalPixels / 2 && median === 0) {
      median = i;
    }
  }
  
  // Calculate mean
  const mean = grayscale.reduce((sum, val) => sum + val, 0) / totalPixels;
  
  // Suggest thresholds
  const suggestions = {
    median,
    mean: Math.round(mean),
    quarter: Math.round(median * 0.75),
    threeQuarter: Math.round(median * 1.25),
    histogram
  };
  
  return suggestions;
};