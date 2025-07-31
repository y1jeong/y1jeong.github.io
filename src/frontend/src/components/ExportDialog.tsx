import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/Button';
import { Label } from './ui/label';
import { Input } from './ui/Input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Checkbox } from './ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/Card';
import { Download, FileText, Image, Code, Database } from 'lucide-react';
import {
  exportDesign,
  downloadFile,
  getMimeType,
  getFileExtension,
  ExportOptions
} from '../utils/fileExport';
import { PerforationPattern, DesignSettings } from '../pages/Design';
import { useToast } from '../hooks/use-toast';

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patterns: PerforationPattern[];
  settings: DesignSettings;
  canvas?: HTMLCanvasElement;
}

interface FormatInfo {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  extension: string;
  supportsGrid: boolean;
  supportsScale: boolean;
  supportsUnits: boolean;
}

const exportFormats: FormatInfo[] = [
  {
    id: 'svg',
    name: 'SVG Vector',
    description: 'Scalable vector graphics for web and print',
    icon: <Code className="h-4 w-4" />,
    extension: '.svg',
    supportsGrid: true,
    supportsScale: true,
    supportsUnits: true
  },
  {
    id: 'dxf',
    name: 'DXF CAD',
    description: 'AutoCAD format for manufacturing',
    icon: <FileText className="h-4 w-4" />,
    extension: '.dxf',
    supportsGrid: false,
    supportsScale: true,
    supportsUnits: true
  },
  {
    id: 'json',
    name: 'JSON Data',
    description: 'Complete design data for backup/sharing',
    icon: <Database className="h-4 w-4" />,
    extension: '.json',
    supportsGrid: false,
    supportsScale: false,
    supportsUnits: false
  },
  {
    id: 'png',
    name: 'PNG Image',
    description: 'High-quality raster image',
    icon: <Image className="h-4 w-4" />,
    extension: '.png',
    supportsGrid: false,
    supportsScale: false,
    supportsUnits: false
  }
];

export const ExportDialog: React.FC<ExportDialogProps> = ({
  open,
  onOpenChange,
  patterns,
  settings,
  canvas
}) => {
  const { toast } = useToast();
  const [selectedFormat, setSelectedFormat] = useState<string>('svg');
  const [filename, setFilename] = useState<string>('perforation-design');
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'svg' as const,
    includeGrid: false,
    scale: 1,
    units: 'mm',
    precision: 2
  });
  const [isExporting, setIsExporting] = useState(false);

  const selectedFormatInfo = exportFormats.find(f => f.id === selectedFormat);

  const handleFormatChange = (format: string) => {
    setSelectedFormat(format);
    setExportOptions(prev => ({
      ...prev,
      format: format as ExportOptions['format']
    }));
  };

  const handleExport = async () => {
    if (patterns.length === 0) {
      toast({
        title: "No patterns to export",
        description: "Please add some perforation patterns before exporting.",
        variant: "destructive"
      });
      return;
    }

    setIsExporting(true);

    try {
      const finalFilename = filename + getFileExtension(selectedFormat);
      const mimeType = getMimeType(selectedFormat);

      if (selectedFormat === 'png') {
        if (!canvas) {
          throw new Error('Canvas not available for PNG export');
        }
        
        // For PNG export, we need to use the canvas
        canvas.toBlob((blob) => {
          if (blob) {
            downloadFile(blob, finalFilename, mimeType);
            toast({
              title: "Export successful",
              description: `Design exported as ${finalFilename}`
            });
          }
        }, 'image/png', 0.9);
      } else {
        const result = exportDesign(patterns, settings, exportOptions);
        
        if (typeof result === 'string') {
          downloadFile(result, finalFilename, mimeType);
          toast({
            title: "Export successful",
            description: `Design exported as ${finalFilename}`
          });
        }
      }

      onOpenChange(false);
    } catch (error) {
      console.error('Export failed:', error);
      toast({
        title: "Export failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
    }
  };

  const getEstimatedFileSize = (): string => {
    const patternCount = patterns.length;
    
    switch (selectedFormat) {
      case 'svg':
        return `~${Math.max(1, Math.round(patternCount * 0.1))} KB`;
      case 'dxf':
        return `~${Math.max(1, Math.round(patternCount * 0.05))} KB`;
      case 'json':
        return `~${Math.max(1, Math.round(patternCount * 0.2))} KB`;
      case 'png':
        return '~50-200 KB';
      default:
        return 'Unknown';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            <div className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Export Design
            </div>
          </DialogTitle>
          <DialogDescription>
            Export your perforation design in various formats for manufacturing, sharing, or backup.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Format Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Export Format</Label>
            <div className="grid grid-cols-2 gap-3">
              {exportFormats.map((format) => (
                <Card
                  key={format.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    selectedFormat === format.id
                      ? 'ring-2 ring-blue-500 bg-blue-50'
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => handleFormatChange(format.id)}
                >
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-sm">
                      {format.icon}
                      {format.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <CardDescription className="text-xs">
                      {format.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Filename */}
          <div className="space-y-2">
            <Label htmlFor="filename">Filename</Label>
            <div className="flex">
              <Input
                id="filename"
                value={filename}
                onChange={(e) => setFilename(e.target.value)}
                placeholder="Enter filename"
                className="rounded-r-none"
              />
              <div className="flex items-center px-3 bg-gray-100 border border-l-0 rounded-r-md text-sm text-gray-600">
                {selectedFormatInfo?.extension}
              </div>
            </div>
          </div>

          {/* Format-specific options */}
          {selectedFormatInfo && (
            <div className="space-y-4">
              {selectedFormatInfo.supportsScale && (
                <div className="space-y-2">
                  <Label htmlFor="scale">Scale Factor</Label>
                  <Input
                    id="scale"
                    type="number"
                    min="0.1"
                    max="10"
                    step="0.1"
                    value={exportOptions.scale}
                    onChange={(e) => setExportOptions(prev => ({
                      ...prev,
                      scale: parseFloat(e.target.value) || 1
                    }))}
                  />
                </div>
              )}

              {selectedFormatInfo.supportsUnits && (
                <div className="space-y-2">
                  <Label htmlFor="units">Units</Label>
                  <Select
                    value={exportOptions.units}
                    onValueChange={(value) => setExportOptions(prev => ({
                      ...prev,
                      units: value as 'mm' | 'inches' | 'pixels'
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mm">Millimeters (mm)</SelectItem>
                      <SelectItem value="inches">Inches</SelectItem>
                      <SelectItem value="pixels">Pixels</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {selectedFormatInfo.supportsGrid && (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="includeGrid"
                    checked={exportOptions.includeGrid}
                    onCheckedChange={(checked) => setExportOptions(prev => ({
                      ...prev,
                      includeGrid: checked as boolean
                    }))}
                  />
                  <Label htmlFor="includeGrid" className="text-sm">
                    Include grid lines
                  </Label>
                </div>
              )}

              {(selectedFormat === 'svg' || selectedFormat === 'dxf') && (
                <div className="space-y-2">
                  <Label htmlFor="precision">Decimal Precision</Label>
                  <Input
                    id="precision"
                    type="number"
                    min="0"
                    max="6"
                    value={exportOptions.precision}
                    onChange={(e) => setExportOptions(prev => ({
                      ...prev,
                      precision: parseInt(e.target.value) || 2
                    }))}
                  />
                </div>
              )}
            </div>
          )}

          {/* Export Info */}
          <Card>
            <CardContent className="pt-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Patterns:</span>
                  <span className="ml-2 text-gray-600">{patterns.length}</span>
                </div>
                <div>
                  <span className="font-medium">Est. Size:</span>
                  <span className="ml-2 text-gray-600">{getEstimatedFileSize()}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleExport}
            disabled={isExporting || !filename.trim()}
            className="min-w-[100px]"
          >
            {isExporting ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Exporting...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                Export
              </div>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ExportDialog;