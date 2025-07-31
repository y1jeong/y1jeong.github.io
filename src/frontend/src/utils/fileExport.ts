import { PerforationPattern, DesignSettings } from '../pages/Design';

export interface ExportOptions {
  format: 'svg' | 'dxf' | 'json' | 'png';
  includeGrid?: boolean;
  scale?: number;
  units?: 'mm' | 'inches' | 'pixels';
  precision?: number;
}

export interface ExportData {
  patterns: PerforationPattern[];
  settings: DesignSettings;
  metadata: {
    exportDate: string;
    version: string;
    units: string;
    scale: number;
  };
}

// Convert units
const convertUnits = (value: number, fromUnit: string, toUnit: string): number => {
  const conversions: Record<string, number> = {
    'mm': 1,
    'inches': 25.4,
    'pixels': 0.264583 // Assuming 96 DPI
  };
  
  const fromFactor = conversions[fromUnit] || 1;
  const toFactor = conversions[toUnit] || 1;
  
  return (value * fromFactor) / toFactor;
};

// Export to SVG format
export const exportToSVG = (
  patterns: PerforationPattern[],
  settings: DesignSettings,
  options: ExportOptions = { format: 'svg' }
): string => {
  const { scale = 1, units = 'mm', precision = 2 } = options;
  
  // Calculate bounds
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  
  patterns.forEach(pattern => {
    const halfSize = pattern.size / 2;
    minX = Math.min(minX, pattern.x - halfSize);
    minY = Math.min(minY, pattern.y - halfSize);
    maxX = Math.max(maxX, pattern.x + halfSize);
    maxY = Math.max(maxY, pattern.y + halfSize);
  });
  
  // Add padding
  const padding = 10;
  minX -= padding;
  minY -= padding;
  maxX += padding;
  maxY += padding;
  
  const width = (maxX - minX) * scale;
  const height = (maxY - minY) * scale;
  
  let svg = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  svg += `<svg xmlns="http://www.w3.org/2000/svg" `;
  svg += `width="${width.toFixed(precision)}${units}" `;
  svg += `height="${height.toFixed(precision)}${units}" `;
  svg += `viewBox="${minX * scale} ${minY * scale} ${width} ${height}">\n`;
  
  // Add metadata
  svg += `  <metadata>\n`;
  svg += `    <title>Wight & Company Design</title>\n`;
  svg += `    <description>Generated on ${new Date().toISOString()}</description>\n`;
  svg += `    <material>${settings.material || 'Unknown'}</material>\n`;
  svg += `    <thickness>${convertUnits(settings.thickness || 0, 'mm', units).toFixed(precision)}${units}</thickness>\n`;
  svg += `  </metadata>\n\n`;
  
  // Add styles
  svg += `  <defs>\n`;
  svg += `    <style>\n`;
  svg += `      .perforation { fill: none; stroke: #000; stroke-width: ${(0.1 * scale).toFixed(precision)}; }\n`;
  svg += `    </style>\n`;
  svg += `  </defs>\n\n`;
  
  // Add grid if requested
  if (options.includeGrid) {
    const gridSize = 20 * scale;
    svg += `  <g id="grid" stroke="#ddd" stroke-width="${(0.05 * scale).toFixed(precision)}" opacity="0.5">\n`;
    
    // Vertical lines
    for (let x = Math.ceil(minX / gridSize) * gridSize; x <= maxX; x += gridSize) {
      svg += `    <line x1="${(x * scale).toFixed(precision)}" y1="${(minY * scale).toFixed(precision)}" `;
      svg += `x2="${(x * scale).toFixed(precision)}" y2="${(maxY * scale).toFixed(precision)}" />\n`;
    }
    
    // Horizontal lines
    for (let y = Math.ceil(minY / gridSize) * gridSize; y <= maxY; y += gridSize) {
      svg += `    <line x1="${(minX * scale).toFixed(precision)}" y1="${(y * scale).toFixed(precision)}" `;
      svg += `x2="${(maxX * scale).toFixed(precision)}" y2="${(y * scale).toFixed(precision)}" />\n`;
    }
    
    svg += `  </g>\n\n`;
  }
  
  // Add patterns
  svg += `  <g id="perforations">\n`;
  
  patterns.forEach((pattern, index) => {
    const x = pattern.x * scale;
    const y = pattern.y * scale;
    const size = pattern.size * scale;
    const rotation = pattern.rotation;
    
    let transform = '';
    if (rotation !== 0) {
      transform = ` transform="rotate(${rotation} ${x.toFixed(precision)} ${y.toFixed(precision)})"`;
    }
    
    svg += `    <!-- Pattern ${index + 1}: ${pattern.type} -->\n`;
    
    switch (pattern.type) {
      case 'circle':
        svg += `    <circle cx="${x.toFixed(precision)}" cy="${y.toFixed(precision)}" `;
        svg += `r="${(size / 2).toFixed(precision)}" class="perforation"${transform} />\n`;
        break;
        
      case 'square':
        svg += `    <rect x="${(x - size / 2).toFixed(precision)}" y="${(y - size / 2).toFixed(precision)}" `;
        svg += `width="${size.toFixed(precision)}" height="${size.toFixed(precision)}" `;
        svg += `class="perforation"${transform} />\n`;
        break;
        
      case 'triangle':
        const points = [
          [x, y - size / 2],
          [x - size / 2, y + size / 2],
          [x + size / 2, y + size / 2]
        ].map(([px, py]) => `${px.toFixed(precision)},${py.toFixed(precision)}`).join(' ');
        svg += `    <polygon points="${points}" class="perforation"${transform} />\n`;
        break;
        
      case 'hexagon':
        const hexPoints = [];
        for (let i = 0; i < 6; i++) {
          const angle = (i * Math.PI) / 3;
          const px = x + (size / 2) * Math.cos(angle);
          const py = y + (size / 2) * Math.sin(angle);
          hexPoints.push(`${px.toFixed(precision)},${py.toFixed(precision)}`);
        }
        svg += `    <polygon points="${hexPoints.join(' ')}" class="perforation"${transform} />\n`;
        break;
        
      case 'star':
        const starPoints = [];
        for (let i = 0; i < 10; i++) {
          const angle = (i * Math.PI) / 5;
          const radius = i % 2 === 0 ? size / 2 : size / 4;
          const px = x + radius * Math.cos(angle - Math.PI / 2);
          const py = y + radius * Math.sin(angle - Math.PI / 2);
          starPoints.push(`${px.toFixed(precision)},${py.toFixed(precision)}`);
        }
        svg += `    <polygon points="${starPoints.join(' ')}" class="perforation"${transform} />\n`;
        break;
    }
  });
  
  svg += `  </g>\n`;
  svg += `</svg>`;
  
  return svg;
};

// Export to DXF format (simplified)
export const exportToDXF = (
  patterns: PerforationPattern[],
  settings: DesignSettings,
  options: ExportOptions = { format: 'dxf' }
): string => {
  const { scale = 1, precision = 3 } = options;
  
  let dxf = '';
  
  // DXF Header
  dxf += '0\nSECTION\n2\nHEADER\n';
  dxf += '9\n$ACADVER\n1\nAC1015\n'; // AutoCAD 2000
  dxf += `9\n$INSUNITS\n70\n${settings.units === 'mm' ? 4 : settings.units === 'in' ? 1 : 0}\n`; // Units
  dxf += '0\nENDSEC\n';
  
  // Add material info as comment
  dxf += `999\nMaterial: ${settings.material}\n`;
  dxf += `999\nThickness: ${settings.thickness}${settings.units}\n`;
  dxf += `999\nDimensions: ${settings.width}x${settings.height}${settings.units}\n`;
  
  // Tables section
  dxf += '0\nSECTION\n2\nTABLES\n';
  dxf += '0\nTABLE\n2\nLAYER\n70\n1\n';
  dxf += '0\nLAYER\n2\nPERFORATIONS\n70\n0\n6\nCONTINUOUS\n62\n7\n';
  dxf += '0\nENDTAB\n0\nENDSEC\n';
  
  // Entities section
  dxf += '0\nSECTION\n2\nENTITIES\n';
  
  patterns.forEach(pattern => {
    const x = pattern.x * scale;
    const y = pattern.y * scale;
    const size = pattern.size * scale;
    
    switch (pattern.type) {
      case 'circle':
        dxf += '0\nCIRCLE\n8\nPERFORATIONS\n';
        dxf += `10\n${x.toFixed(precision)}\n20\n${y.toFixed(precision)}\n30\n0.0\n`;
        dxf += `40\n${(size / 2).toFixed(precision)}\n`;
        break;
        
      case 'square':
        // Draw as polyline
        dxf += '0\nLWPOLYLINE\n8\nPERFORATIONS\n90\n4\n70\n1\n';
        const halfSize = size / 2;
        dxf += `10\n${(x - halfSize).toFixed(precision)}\n20\n${(y - halfSize).toFixed(precision)}\n`;
        dxf += `10\n${(x + halfSize).toFixed(precision)}\n20\n${(y - halfSize).toFixed(precision)}\n`;
        dxf += `10\n${(x + halfSize).toFixed(precision)}\n20\n${(y + halfSize).toFixed(precision)}\n`;
        dxf += `10\n${(x - halfSize).toFixed(precision)}\n20\n${(y + halfSize).toFixed(precision)}\n`;
        break;
        
      // Add other shapes as needed
    }
  });
  
  dxf += '0\nENDSEC\n0\nEOF\n';
  
  return dxf;
};

// Export to JSON format
export const exportToJSON = (
  patterns: PerforationPattern[],
  settings: DesignSettings,
  options: ExportOptions = { format: 'json' }
): string => {
  const exportData: ExportData = {
    patterns,
    settings,
    metadata: {
      exportDate: new Date().toISOString(),
      version: '1.0.0',
      units: options.units || 'mm',
      scale: options.scale || 1
    }
  };
  
  return JSON.stringify(exportData, null, 2);
};

// Export to PNG (requires canvas)
export const exportToPNG = (
  canvas: HTMLCanvasElement,
  options: ExportOptions = { format: 'png' }
): Promise<Blob> => {
  const quality = options.scale ? Math.min(options.scale, 1.0) : 0.9;
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve(blob!);
    }, 'image/png', quality);
  });
};

// Main export function
export const exportDesign = (
  patterns: PerforationPattern[],
  settings: DesignSettings,
  options: ExportOptions
): string | Promise<Blob> => {
  switch (options.format) {
    case 'svg':
      return exportToSVG(patterns, settings, options);
    case 'dxf':
      return exportToDXF(patterns, settings, options);
    case 'json':
      return exportToJSON(patterns, settings, options);
    default:
      throw new Error(`Unsupported export format: ${options.format}`);
  }
};

// Download helper function
export const downloadFile = (content: string | Blob, filename: string, mimeType: string) => {
  const blob = content instanceof Blob ? content : new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
};

// Get appropriate MIME type for format
export const getMimeType = (format: string): string => {
  const mimeTypes: Record<string, string> = {
    'svg': 'image/svg+xml',
    'dxf': 'application/dxf',
    'json': 'application/json',
    'png': 'image/png'
  };
  
  return mimeTypes[format] || 'text/plain';
};

// Get appropriate file extension
export const getFileExtension = (format: string): string => {
  const extensions: Record<string, string> = {
    'svg': '.svg',
    'dxf': '.dxf',
    'json': '.json',
    'png': '.png'
  };
  
  return extensions[format] || '.txt';
};