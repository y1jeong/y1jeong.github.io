import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { useAuth } from '@/contexts/AuthContext';
import ImageUpload from '@/components/ImageUpload';
import { 
  Save, 
  Download, 
  Upload, 
  RotateCcw, 
  ZoomIn, 
  ZoomOut, 
  Grid, 
  Eye, 
  EyeOff,
  Settings,
  Layers,
  Move,
  Copy,
  Trash2,
  Square,
  Circle,
  Triangle,
  Star,
  Hexagon
} from 'lucide-react';

import { generatePerforationsFromImage, analyzeImageHistogram } from '@/utils/imageProcessing';
import PreviewCanvas from '@/components/PreviewCanvas';
import ExportDialog from '@/components/ExportDialog';

export interface DesignSettings {
  width: number;
  height: number;
  thickness: number;
  material: string;
  units: 'mm' | 'cm' | 'in';
}

export interface PerforationPattern {
  id: string;
  type: 'circle' | 'square' | 'triangle' | 'hexagon' | 'star' | 'custom';
  size: number;
  spacing: number;
  rotation: number;
  x: number;
  y: number;
  selected: boolean;
}

interface PerforationSettings {
  minSize: number;
  maxSize: number;
  defaultSize: number;
  minSpacing: number;
  maxSpacing: number;
  defaultSpacing: number;
  allowRotation: boolean;
  snapToGrid: boolean;
  gridSize: number;
  distributionPattern: 'grid' | 'staggered' | 'random' | 'radial';
  density: number;
  // Image processing parameters
  threshold: number;
  invert: boolean;
}

interface UploadedImage {
  file: File;
  imageData: ImageData;
  preview: string;
}

export interface DesignState {
  settings: DesignSettings;
  perforationSettings: PerforationSettings;
  patterns: PerforationPattern[];
  uploadedImage: UploadedImage | null;
  zoom: number;
  panX: number;
  panY: number;
  showGrid: boolean;
  showPreview: boolean;
  selectedTool: 'select' | 'circle' | 'square' | 'triangle' | 'hexagon' | 'star' | 'move' | 'copy' | 'delete';
}



const MATERIALS = [
  'Aluminum',
  'Steel',
  'Stainless Steel',
  'Brass',
  'Copper',
  'Plastic',
  'Wood'
];

export const Design: React.FC = () => {
  const { user } = useAuth();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [designState, setDesignState] = useState<DesignState>({
    settings: {
      width: 1000,
      height: 600,
      thickness: 3,
      material: 'Aluminum',
      units: 'mm'
    },
    perforationSettings: {
      minSize: 5,
      maxSize: 50,
      defaultSize: 20,
      minSpacing: 10,
      maxSpacing: 100,
      defaultSpacing: 30,
      allowRotation: true,
      snapToGrid: false,
      gridSize: 10,
      distributionPattern: 'grid',
      density: 50,
      threshold: 128,
      invert: false
    },
    patterns: [],
    uploadedImage: null,
    zoom: 1,
    panX: 0,
    panY: 0,
    showGrid: true,
    showPreview: false,
    selectedTool: 'select'
  });

  const [selectedPatterns, setSelectedPatterns] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);

  // Canvas resize handler
  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const container = canvas?.parentElement;
    if (!canvas || !container) return;

    const rect = container.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
    
    // Redraw after resize
    redrawCanvas();
  }, []);

  // Canvas drawing functions
  const drawGrid = useCallback((ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    if (!designState.showGrid) return;

    const gridSize = 20 * designState.zoom;
    const offsetX = designState.panX % gridSize;
    const offsetY = designState.panY % gridSize;

    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    ctx.setLineDash([]);

    // Vertical lines
    for (let x = offsetX; x < canvas.width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }

    // Horizontal lines
    for (let y = offsetY; y < canvas.height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }
  }, [designState.showGrid, designState.zoom, designState.panX, designState.panY]);

  const drawPattern = useCallback((ctx: CanvasRenderingContext2D, pattern: PerforationPattern) => {
    const x = pattern.x * designState.zoom + designState.panX;
    const y = pattern.y * designState.zoom + designState.panY;
    const size = pattern.size * designState.zoom;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate((pattern.rotation * Math.PI) / 180);

    // Set style based on selection
    if (pattern.selected) {
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 2;
      ctx.fillStyle = 'rgba(59, 130, 246, 0.1)';
    } else {
      ctx.strokeStyle = '#374151';
      ctx.lineWidth = 1;
      ctx.fillStyle = designState.showPreview ? '#f3f4f6' : 'transparent';
    }

    ctx.beginPath();
    switch (pattern.type) {
      case 'circle':
        ctx.arc(0, 0, size / 2, 0, 2 * Math.PI);
        break;
      case 'square':
        ctx.rect(-size / 2, -size / 2, size, size);
        break;
      case 'triangle':
        ctx.moveTo(0, -size / 2);
        ctx.lineTo(-size / 2, size / 2);
        ctx.lineTo(size / 2, size / 2);
        ctx.closePath();
        break;
      case 'hexagon':
        for (let i = 0; i < 6; i++) {
          const angle = (i * Math.PI) / 3;
          const px = (size / 2) * Math.cos(angle);
          const py = (size / 2) * Math.sin(angle);
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        break;
      case 'star':
        for (let i = 0; i < 10; i++) {
          const angle = (i * Math.PI) / 5;
          const radius = i % 2 === 0 ? size / 2 : size / 4;
          const px = radius * Math.cos(angle - Math.PI / 2);
          const py = radius * Math.sin(angle - Math.PI / 2);
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        break;
    }

    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }, [designState.zoom, designState.panX, designState.panY, designState.showPreview]);

  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw grid
    drawGrid(ctx, canvas);

    // Draw patterns
    designState.patterns.forEach(pattern => {
      drawPattern(ctx, pattern);
    });
  }, [designState.patterns, drawGrid, drawPattern]);

  // Canvas event handlers
  const handlePatternClick = useCallback((patternId: string, event: React.MouseEvent) => {
    if (!event.ctrlKey && !event.metaKey) {
      setSelectedPatterns([patternId]);
    } else {
      setSelectedPatterns(prev => 
        prev.includes(patternId)
          ? prev.filter(id => id !== patternId)
          : [...prev, patternId]
      );
    }
  }, []);

  const handleCanvasClick = useCallback((x: number, y: number, event: React.MouseEvent) => {
    if (designState.selectedTool === 'select') {
      // Clear selection if clicking on empty space
      if (!event.ctrlKey && !event.metaKey) {
        setSelectedPatterns([]);
      }
    } else if (['circle', 'square', 'triangle', 'hexagon', 'star'].includes(designState.selectedTool)) {
      // Add new pattern with perforation settings constraints
      let finalX = x;
      let finalY = y;
      
      // Apply snap to grid if enabled
      if (designState.perforationSettings.snapToGrid) {
        const gridSize = designState.perforationSettings.gridSize;
        finalX = Math.round(x / gridSize) * gridSize;
        finalY = Math.round(y / gridSize) * gridSize;
      }
      
      const newPattern: PerforationPattern = {
        id: `pattern-${Date.now()}-${Math.random()}`,
        type: designState.selectedTool as any,
        size: designState.perforationSettings.defaultSize,
        spacing: designState.perforationSettings.defaultSpacing,
        rotation: 0,
        x: finalX,
        y: finalY,
        selected: false
      };

      setDesignState(prev => ({
        ...prev,
        patterns: [...prev.patterns, newPattern]
      }));
    } else if (designState.selectedTool === 'copy') {
      // Copy pattern at click location
      const clickedPattern = designState.patterns.find(pattern => {
        const dx = x - pattern.x;
        const dy = y - pattern.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance <= pattern.size / 2;
      });

      if (clickedPattern) {
        const copiedPattern: PerforationPattern = {
          ...clickedPattern,
          id: `pattern-${Date.now()}-${Math.random()}`,
          x: x + 30, // Offset the copy slightly
          y: y + 30,
          selected: false
        };

        setDesignState(prev => ({
          ...prev,
          patterns: [...prev.patterns, copiedPattern]
        }));
        
        // Select the new copied pattern
        setSelectedPatterns([copiedPattern.id]);
      }
    } else if (designState.selectedTool === 'delete') {
      // Delete pattern at click location
      const clickedPattern = designState.patterns.find(pattern => {
        const dx = x - pattern.x;
        const dy = y - pattern.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance <= pattern.size / 2;
      });

      if (clickedPattern) {
        setDesignState(prev => ({
          ...prev,
          patterns: prev.patterns.filter(p => p.id !== clickedPattern.id)
        }));
        
        // Remove from selection if it was selected
        setSelectedPatterns(prev => prev.filter(id => id !== clickedPattern.id));
      }
    }
  }, [designState.selectedTool, designState.panX, designState.panY, designState.zoom, designState.patterns]);

  const handleCanvasMouseDown = useCallback((e: React.MouseEvent) => {
    // Handle panning with middle mouse button, right mouse button, or space+left click
    const shouldPan = e.button === 1 || e.button === 2 || (e.button === 0 && isSpacePressed);
    
    if (shouldPan) {
      e.preventDefault();
      setIsPanning(true);
      setPanStart({ x: e.clientX, y: e.clientY });
      return;
    }
    
    // Original move tool functionality
    if (designState.selectedTool === 'move' && e.button === 0) {
      setIsDragging(true);
      setDragStart({ x: e.clientX, y: e.clientY });
    }
  }, [designState.selectedTool, isSpacePressed]);

  const handleCanvasMouseMove = useCallback((e: React.MouseEvent) => {
    // Handle panning
    if (isPanning) {
      const dx = e.clientX - panStart.x;
      const dy = e.clientY - panStart.y;
      
      setDesignState(prev => ({
        ...prev,
        panX: prev.panX + dx,
        panY: prev.panY + dy
      }));
      
      setPanStart({ x: e.clientX, y: e.clientY });
      return;
    }
    
    // Original move tool functionality
    if (isDragging && designState.selectedTool === 'move') {
      const dx = e.clientX - dragStart.x;
      const dy = e.clientY - dragStart.y;
      
      setDesignState(prev => ({
        ...prev,
        panX: prev.panX + dx,
        panY: prev.panY + dy
      }));
      
      setDragStart({ x: e.clientX, y: e.clientY });
    }
  }, [isPanning, panStart, isDragging, dragStart, designState.selectedTool]);

  const handleCanvasMouseUp = useCallback((e: React.MouseEvent) => {
    if (e.button === 1 || e.button === 2 || isPanning) {
      setIsPanning(false);
    }
    setIsDragging(false);
  }, [isPanning]);

  const handleSave = useCallback(async () => {
    try {
      const designData = {
        name: `Design ${new Date().toLocaleDateString()}`,
        description: 'Created in Design Studio',
        panelSize: {
          width: designState.settings.width,
          height: designState.settings.height
        },
        perforationSettings: {
          minSize: 5,
          maxSize: 50,
          shape: 'circle',
          pattern: 'grid',
          spacing: { x: 20, y: 20 }
        },
        patterns: designState.patterns.map(p => ({
          type: p.type,
          size: p.size,
          x: p.x,
          y: p.y,
          rotation: p.rotation
        }))
      };
      
      // For now, save to localStorage as a demo
      const savedDesigns = JSON.parse(localStorage.getItem('savedDesigns') || '[]');
      const newDesign = {
        id: Date.now().toString(),
        ...designData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      savedDesigns.push(newDesign);
      localStorage.setItem('savedDesigns', JSON.stringify(savedDesigns));
      
      alert('Design saved successfully!');
    } catch (error) {
      console.error('Save failed:', error);
      alert('Failed to save design. Please try again.');
    }
  }, [designState.settings.width, designState.settings.height, designState.patterns]);

  // Update pattern selection
  useEffect(() => {
    setDesignState(prev => ({
      ...prev,
      patterns: prev.patterns.map(pattern => ({
        ...pattern,
        selected: selectedPatterns.includes(pattern.id)
      }))
    }));
  }, [selectedPatterns]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Space key for panning
      if (e.code === 'Space' && !isSpacePressed) {
        setIsSpacePressed(true);
        e.preventDefault();
      }
      
      // Delete selected patterns
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedPatterns.length > 0) {
          setDesignState(prev => ({
            ...prev,
            patterns: prev.patterns.filter(p => !selectedPatterns.includes(p.id))
          }));
          setSelectedPatterns([]);
          e.preventDefault();
        }
      }
      
      // Copy selected patterns (Ctrl+C)
      if (e.ctrlKey && e.key === 'c' && selectedPatterns.length > 0) {
        const selectedPatternsData = designState.patterns.filter(p => selectedPatterns.includes(p.id));
        localStorage.setItem('copiedPatterns', JSON.stringify(selectedPatternsData));
        e.preventDefault();
      }
      
      // Paste patterns (Ctrl+V)
      if (e.ctrlKey && e.key === 'v') {
        try {
          const copiedPatterns = JSON.parse(localStorage.getItem('copiedPatterns') || '[]');
          if (copiedPatterns.length > 0) {
            const newPatterns = copiedPatterns.map((pattern: PerforationPattern) => ({
              ...pattern,
              id: `pattern-${Date.now()}-${Math.random()}`,
              x: pattern.x + 50,
              y: pattern.y + 50,
              selected: false
            }));
            
            setDesignState(prev => ({
              ...prev,
              patterns: [...prev.patterns, ...newPatterns]
            }));
            
            setSelectedPatterns(newPatterns.map((p: PerforationPattern) => p.id));
          }
        } catch (error) {
          console.error('Failed to paste patterns:', error);
        }
        e.preventDefault();
      }
      
      // Save (Ctrl+S)
      if (e.ctrlKey && e.key === 's') {
        handleSave();
        e.preventDefault();
      }
      
      // Select all (Ctrl+A)
      if (e.ctrlKey && e.key === 'a') {
        setSelectedPatterns(designState.patterns.map(p => p.id));
        e.preventDefault();
      }
      
      // Escape to deselect
      if (e.key === 'Escape') {
        setSelectedPatterns([]);
        setDesignState(prev => ({ ...prev, selectedTool: 'select' }));
      }
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      // Release space key
      if (e.code === 'Space') {
        setIsSpacePressed(false);
        setIsPanning(false); // Stop panning if space is released
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [selectedPatterns, designState.patterns, handleSave, isSpacePressed]);

  // Handle canvas resize
  useEffect(() => {
    const handleResize = () => {
      resizeCanvas();
    };

    window.addEventListener('resize', handleResize);
    
    // Initial resize
    const timer = setTimeout(() => {
      resizeCanvas();
    }, 100);

    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timer);
    };
  }, [resizeCanvas]);

  // Redraw canvas when state changes
  useEffect(() => {
    redrawCanvas();
  }, [redrawCanvas]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' && selectedPatterns.length > 0) {
        setDesignState(prev => ({
          ...prev,
          patterns: prev.patterns.filter(pattern => !selectedPatterns.includes(pattern.id))
        }));
        setSelectedPatterns([]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedPatterns]);

  const handleZoom = (delta: number) => {
    setDesignState(prev => ({
      ...prev,
      zoom: Math.max(0.1, Math.min(5, prev.zoom + delta))
    }));
  };

  const handleReset = () => {
    setDesignState(prev => ({
      ...prev,
      zoom: 1,
      panX: 0,
      panY: 0
    }));
  };



  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      const text = await file.text();
      const importData = JSON.parse(text);
      
      if (importData.settings && importData.patterns) {
        setDesignState(prev => ({
          ...prev,
          settings: { ...prev.settings, ...importData.settings },
          patterns: importData.patterns || []
        }));
        setSelectedPatterns([]);
        alert('Design imported successfully!');
      } else {
        alert('Invalid file format. Please select a valid design file.');
      }
    } catch (error) {
      console.error('Import failed:', error);
      alert('Failed to import design. Please check the file format.');
    }
    
    // Reset file input
    e.target.value = '';
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Top toolbar */}
      <div className="border-b bg-card p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-semibold">Design Studio</h1>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={handleSave}>
                <Save className="h-4 w-4 mr-2" />
                Save
              </Button>
              <Button variant="outline" size="sm" onClick={() => setShowExportDialog(true)}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <label>
                <Button variant="outline" size="sm" asChild>
                  <span>
                    <Upload className="h-4 w-4 mr-2" />
                    Import
                  </span>
                </Button>
                <input
                  type="file"
                  accept=".json,.dxf,.svg"
                  onChange={handleImport}
                  className="hidden"
                />
              </label>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant={showSettings ? 'default' : 'outline'}
              size="sm"
              onClick={() => setShowSettings(!showSettings)}
            >
              <Settings className="h-4 w-4" />
            </Button>
            <span className="text-sm text-muted-foreground">
              Welcome, {(user?.firstName && user?.lastName) ? `${user.firstName} ${user.lastName}` : 'User'}
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar - Tools */}
        <div className="w-16 border-r bg-card flex flex-col items-center py-4 space-y-2">
          {/* Tool buttons */}
          {[
            { tool: 'select', icon: Move, label: 'Select' },
            { tool: 'circle', icon: Circle, label: 'Circle' },
            { tool: 'square', icon: Square, label: 'Square' },
            { tool: 'triangle', icon: Triangle, label: 'Triangle' },
            { tool: 'hexagon', icon: Hexagon, label: 'Hexagon' },
            { tool: 'star', icon: Star, label: 'Star' },
            { tool: 'move', icon: Move, label: 'Pan' },
            { tool: 'copy', icon: Copy, label: 'Copy' },
            { tool: 'delete', icon: Trash2, label: 'Delete' }
          ].map(({ tool, icon: Icon, label }) => (
            <Button
              key={tool}
              variant={designState.selectedTool === tool ? 'default' : 'ghost'}
              size="icon"
              onClick={() => setDesignState(prev => ({ ...prev, selectedTool: tool as any }))}
              title={label}
            >
              <Icon className="h-4 w-4" />
            </Button>
          ))}
          
          <div className="border-t pt-2 mt-4 space-y-2">
            <Button
              variant={designState.showGrid ? 'default' : 'ghost'}
              size="icon"
              onClick={() => setDesignState(prev => ({ ...prev, showGrid: !prev.showGrid }))}
              title="Toggle Grid"
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={designState.showPreview ? 'default' : 'ghost'}
              size="icon"
              onClick={() => setDesignState(prev => ({ ...prev, showPreview: !prev.showPreview }))}
              title="Toggle Preview"
            >
              {designState.showPreview ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Main canvas area */}
        <div className="flex-1 flex flex-col">
          {/* Canvas controls */}
          <div className="border-b bg-card p-2 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={() => handleZoom(-0.1)}>
                <ZoomOut className="h-4 w-4" />
              </Button>
              <span className="text-sm font-mono min-w-[60px] text-center">
                {Math.round(designState.zoom * 100)}%
              </span>
              <Button variant="outline" size="sm" onClick={() => handleZoom(0.1)}>
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={handleReset}>
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="flex items-center space-x-2">
              <span className="text-sm text-muted-foreground">
                {designState.patterns.length} patterns
              </span>
              {selectedPatterns.length > 0 && (
                <span className="text-sm text-primary">
                  {selectedPatterns.length} selected
                </span>
              )}
            </div>
          </div>

          {/* Canvas */}
          <div className="flex-1 overflow-hidden relative bg-white">
            <PreviewCanvas
              designState={designState}
              selectedPatterns={selectedPatterns}
              onPatternClick={handlePatternClick}
              onCanvasClick={handleCanvasClick}
              onPanStart={handleCanvasMouseDown}
              onPanMove={handleCanvasMouseMove}
              onPanEnd={() => handleCanvasMouseUp({} as React.MouseEvent)}
            />
          </div>
        </div>

        {/* Right sidebar - Properties */}
        {showSettings && (
          <div className="w-80 border-l bg-card p-4 space-y-6 overflow-y-auto">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Design Settings</CardTitle>
                <CardDescription>
                  Configure your wall dimensions and material
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    type="number"
                    label="Width"
                    value={designState.settings.width}
                    onChange={(e) => setDesignState(prev => ({
                      ...prev,
                      settings: { ...prev.settings, width: Number(e.target.value) }
                    }))}
                  />
                  <Input
                    type="number"
                    label="Height"
                    value={designState.settings.height}
                    onChange={(e) => setDesignState(prev => ({
                      ...prev,
                      settings: { ...prev.settings, height: Number(e.target.value) }
                    }))}
                  />
                </div>
                
                <Input
                  type="number"
                  label="Thickness"
                  value={designState.settings.thickness}
                  onChange={(e) => setDesignState(prev => ({
                    ...prev,
                    settings: { ...prev.settings, thickness: Number(e.target.value) }
                  }))}
                />
                
                <div>
                  <label className="block text-sm font-medium mb-2">Material</label>
                  <select
                    value={designState.settings.material}
                    onChange={(e) => setDesignState(prev => ({
                      ...prev,
                      settings: { ...prev.settings, material: e.target.value }
                    }))}
                    className="w-full p-2 border rounded-md"
                  >
                    {MATERIALS.map(material => (
                      <option key={material} value={material}>{material}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Units</label>
                  <select
                    value={designState.settings.units}
                    onChange={(e) => setDesignState(prev => ({
                      ...prev,
                      settings: { ...prev.settings, units: e.target.value as any }
                    }))}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="mm">Millimeters (mm)</option>
                    <option value="cm">Centimeters (cm)</option>
                    <option value="in">Inches (in)</option>
                  </select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Image Upload</CardTitle>
                <CardDescription>
                  Upload a halftone image to generate perforations
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ImageUpload
                  onImageUpload={(file) => {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                      const img = new Image();
                      img.onload = () => {
                        const canvas = document.createElement('canvas');
                        const ctx = canvas.getContext('2d')!;
                        canvas.width = img.width;
                        canvas.height = img.height;
                        ctx.drawImage(img, 0, 0);
                        const imageData = ctx.getImageData(0, 0, img.width, img.height);
                        
                        setDesignState(prev => ({
                          ...prev,
                          uploadedImage: {
                            file,
                            imageData,
                            preview: e.target?.result as string
                          }
                        }));
                      };
                      img.src = e.target?.result as string;
                    };
                    reader.readAsDataURL(file);
                  }}
                  onImageRemove={() => {
                    setDesignState(prev => ({
                      ...prev,
                      uploadedImage: null
                    }));
                  }}
                />
                
                {designState.uploadedImage && (
                  <>
                    <div className="border-t pt-4 space-y-4">
                      <h4 className="text-sm font-medium">Processing Settings</h4>
                      
                      <div>
                        <label className="block text-sm font-medium mb-2">Brightness Threshold</label>
                        <input
                          type="range"
                          min="0"
                          max="255"
                          value={designState.perforationSettings.threshold}
                          onChange={(e) => setDesignState(prev => ({
                            ...prev,
                            perforationSettings: { ...prev.perforationSettings, threshold: Number(e.target.value) }
                          }))}
                          className="w-full"
                        />
                        <div className="flex justify-between text-xs text-muted-foreground mt-1">
                          <span>0</span>
                          <span>{designState.perforationSettings.threshold}</span>
                          <span>255</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="invertImage"
                          checked={designState.perforationSettings.invert}
                          onChange={(e) => setDesignState(prev => ({
                            ...prev,
                            perforationSettings: { ...prev.perforationSettings, invert: e.target.checked }
                          }))}
                        />
                        <label htmlFor="invertImage" className="text-sm">Invert Image (dark areas = perforations)</label>
                      </div>
                      
                      <Button
                        onClick={() => {
                          if (!designState.uploadedImage) return;
                          
                          try {
                            const result = generatePerforationsFromImage(
                              designState.uploadedImage.imageData,
                              designState.settings.width,
                              designState.settings.height,
                              {
                                minSize: designState.perforationSettings.minSize,
                                maxSize: designState.perforationSettings.maxSize,
                                minSpacing: designState.perforationSettings.minSpacing,
                                maxSpacing: designState.perforationSettings.maxSpacing,
                                density: designState.perforationSettings.density,
                                snapToGrid: designState.perforationSettings.snapToGrid,
                                gridSize: designState.perforationSettings.gridSize,
                                threshold: designState.perforationSettings.threshold,
                                invert: designState.perforationSettings.invert
                              }
                            );
                            
                            // Replace existing patterns with image-generated ones
                            setDesignState(prev => ({
                              ...prev,
                              patterns: result.patterns
                            }));
                            
                            // Show success message with statistics
                            const successDiv = document.createElement('div');
                            successDiv.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded shadow-lg z-50';
                            successDiv.innerHTML = `
                              <div>Generated ${result.statistics.totalPerforations} perforations</div>
                              <div>Coverage: ${result.statistics.coverage.toFixed(1)}%</div>
                              <div>Avg Size: ${result.statistics.averageSize.toFixed(1)}</div>
                            `;
                            document.body.appendChild(successDiv);
                            setTimeout(() => document.body.removeChild(successDiv), 5000);
                          } catch (error) {
                            console.error('Failed to generate perforations:', error);
                            alert('Failed to generate perforations from image. Please try again.');
                          }
                        }}
                        className="w-full"
                        disabled={!designState.uploadedImage}
                      >
                        Generate Perforations from Image
                      </Button>
                      
                      <Button
                        variant="outline"
                        onClick={() => {
                          if (!designState.uploadedImage) return;
                          
                          try {
                            const histogram = analyzeImageHistogram(designState.uploadedImage.imageData);
                            
                            // Update threshold to suggested median value
                            setDesignState(prev => ({
                              ...prev,
                              perforationSettings: { ...prev.perforationSettings, threshold: histogram.median }
                            }));
                            
                            // Show analysis results
                            const infoDiv = document.createElement('div');
                            infoDiv.className = 'fixed top-4 right-4 bg-blue-500 text-white px-4 py-2 rounded shadow-lg z-50';
                            infoDiv.innerHTML = `
                              <div>Image Analysis Complete</div>
                              <div>Suggested threshold: ${histogram.median}</div>
                              <div>Mean brightness: ${histogram.mean}</div>
                            `;
                            document.body.appendChild(infoDiv);
                            setTimeout(() => document.body.removeChild(infoDiv), 4000);
                          } catch (error) {
                            console.error('Failed to analyze image:', error);
                            alert('Failed to analyze image. Please try again.');
                          }
                        }}
                        className="w-full"
                        disabled={!designState.uploadedImage}
                      >
                        Auto-Analyze Image
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Perforation Settings</CardTitle>
                <CardDescription>
                  Configure perforation parameters and constraints
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Min Size</label>
                    <Input
                      type="number"
                      value={designState.perforationSettings.minSize}
                      onChange={(e) => setDesignState(prev => ({
                        ...prev,
                        perforationSettings: { ...prev.perforationSettings, minSize: Number(e.target.value) }
                      }))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Max Size</label>
                    <Input
                      type="number"
                      value={designState.perforationSettings.maxSize}
                      onChange={(e) => setDesignState(prev => ({
                        ...prev,
                        perforationSettings: { ...prev.perforationSettings, maxSize: Number(e.target.value) }
                      }))}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Min Spacing</label>
                    <Input
                      type="number"
                      value={designState.perforationSettings.minSpacing}
                      onChange={(e) => setDesignState(prev => ({
                        ...prev,
                        perforationSettings: { ...prev.perforationSettings, minSpacing: Number(e.target.value) }
                      }))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Max Spacing</label>
                    <Input
                      type="number"
                      value={designState.perforationSettings.maxSpacing}
                      onChange={(e) => setDesignState(prev => ({
                        ...prev,
                        perforationSettings: { ...prev.perforationSettings, maxSpacing: Number(e.target.value) }
                      }))}
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Distribution Pattern</label>
                  <select
                    value={designState.perforationSettings.distributionPattern}
                    onChange={(e) => setDesignState(prev => ({
                      ...prev,
                      perforationSettings: { ...prev.perforationSettings, distributionPattern: e.target.value as any }
                    }))}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="grid">Grid</option>
                    <option value="staggered">Staggered</option>
                    <option value="random">Random</option>
                    <option value="radial">Radial</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Density</label>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={designState.perforationSettings.density}
                    onChange={(e) => setDesignState(prev => ({
                      ...prev,
                      perforationSettings: { ...prev.perforationSettings, density: Number(e.target.value) }
                    }))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>10%</span>
                    <span>{designState.perforationSettings.density}%</span>
                    <span>100%</span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="allowRotation"
                      checked={designState.perforationSettings.allowRotation}
                      onChange={(e) => setDesignState(prev => ({
                        ...prev,
                        perforationSettings: { ...prev.perforationSettings, allowRotation: e.target.checked }
                      }))}
                    />
                    <label htmlFor="allowRotation" className="text-sm">Allow Rotation</label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="snapToGrid"
                      checked={designState.perforationSettings.snapToGrid}
                      onChange={(e) => setDesignState(prev => ({
                        ...prev,
                        perforationSettings: { ...prev.perforationSettings, snapToGrid: e.target.checked }
                      }))}
                    />
                    <label htmlFor="snapToGrid" className="text-sm">Snap to Grid</label>
                  </div>
                </div>
                
                {designState.perforationSettings.snapToGrid && (
                   <div>
                     <label className="block text-sm font-medium mb-2">Grid Size</label>
                     <Input
                       type="number"
                       value={designState.perforationSettings.gridSize}
                       onChange={(e) => setDesignState(prev => ({
                         ...prev,
                         perforationSettings: { ...prev.perforationSettings, gridSize: Number(e.target.value) }
                       }))}
                     />
                   </div>
                 )}
                 
                 <div className="pt-4 border-t">
                   <Button
                     onClick={() => {
                       const { distributionPattern, density, defaultSize, defaultSpacing } = designState.perforationSettings;
                       const { width, height } = designState.settings;
                       const newPatterns: PerforationPattern[] = [];
                       
                       if (distributionPattern === 'grid') {
                         const spacing = defaultSpacing * (100 / density);
                         const cols = Math.floor(width / spacing);
                         const rows = Math.floor(height / spacing);
                         
                         for (let i = 0; i < cols; i++) {
                           for (let j = 0; j < rows; j++) {
                             let x = (i + 0.5) * spacing;
                             let y = (j + 0.5) * spacing;
                             
                             if (designState.perforationSettings.snapToGrid) {
                               const gridSize = designState.perforationSettings.gridSize;
                               x = Math.round(x / gridSize) * gridSize;
                               y = Math.round(y / gridSize) * gridSize;
                             }
                             
                             newPatterns.push({
                               id: `pattern-${Date.now()}-${i}-${j}`,
                               type: 'circle',
                               size: defaultSize,
                               spacing: defaultSpacing,
                               rotation: 0,
                               x,
                               y,
                               selected: false
                             });
                           }
                         }
                       } else if (distributionPattern === 'random') {
                         const count = Math.floor((width * height) / (defaultSpacing * defaultSpacing) * (density / 100));
                         
                         for (let i = 0; i < count; i++) {
                           let x = Math.random() * width;
                           let y = Math.random() * height;
                           
                           if (designState.perforationSettings.snapToGrid) {
                             const gridSize = designState.perforationSettings.gridSize;
                             x = Math.round(x / gridSize) * gridSize;
                             y = Math.round(y / gridSize) * gridSize;
                           }
                           
                           newPatterns.push({
                             id: `pattern-${Date.now()}-${i}`,
                             type: 'circle',
                             size: defaultSize,
                             spacing: defaultSpacing,
                             rotation: 0,
                             x,
                             y,
                             selected: false
                           });
                         }
                       }
                       
                       setDesignState(prev => ({
                         ...prev,
                         patterns: [...prev.patterns, ...newPatterns]
                       }));
                     }}
                     className="w-full"
                   >
                     Generate Pattern Array
                   </Button>
                 </div>
               </CardContent>
             </Card>

            {selectedPatterns.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Pattern Properties</CardTitle>
                  <CardDescription>
                    Edit selected pattern properties
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-sm text-muted-foreground">
                    {selectedPatterns.length} pattern(s) selected
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Size</label>
                    <input
                      type="range"
                      min={designState.perforationSettings.minSize}
                      max={designState.perforationSettings.maxSize}
                      value={designState.patterns.find(p => selectedPatterns.includes(p.id))?.size || designState.perforationSettings.defaultSize}
                      onChange={(e) => {
                        const newSize = parseInt(e.target.value);
                        setDesignState(prev => ({
                          ...prev,
                          patterns: prev.patterns.map(p => 
                            selectedPatterns.includes(p.id) 
                              ? { ...p, size: newSize }
                              : p
                          )
                        }));
                      }}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>{designState.perforationSettings.minSize}</span>
                      <span>{designState.patterns.find(p => selectedPatterns.includes(p.id))?.size || designState.perforationSettings.defaultSize}</span>
                      <span>{designState.perforationSettings.maxSize}</span>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Spacing</label>
                    <input
                      type="range"
                      min={designState.perforationSettings.minSpacing}
                      max={designState.perforationSettings.maxSpacing}
                      value={designState.patterns.find(p => selectedPatterns.includes(p.id))?.spacing || designState.perforationSettings.defaultSpacing}
                      onChange={(e) => {
                        const newSpacing = parseInt(e.target.value);
                        setDesignState(prev => ({
                          ...prev,
                          patterns: prev.patterns.map(p => 
                            selectedPatterns.includes(p.id) 
                              ? { ...p, spacing: newSpacing }
                              : p
                          )
                        }));
                      }}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>{designState.perforationSettings.minSpacing}</span>
                      <span>{designState.patterns.find(p => selectedPatterns.includes(p.id))?.spacing || designState.perforationSettings.defaultSpacing}</span>
                      <span>{designState.perforationSettings.maxSpacing}</span>
                    </div>
                  </div>
                  
                  {designState.perforationSettings.allowRotation && (
                    <div>
                      <label className="block text-sm font-medium mb-2">Rotation</label>
                      <input
                        type="range"
                        min="0"
                        max="360"
                        value={designState.patterns.find(p => selectedPatterns.includes(p.id))?.rotation || 0}
                        onChange={(e) => {
                          const newRotation = parseInt(e.target.value);
                          setDesignState(prev => ({
                            ...prev,
                            patterns: prev.patterns.map(p => 
                              selectedPatterns.includes(p.id) 
                                ? { ...p, rotation: newRotation }
                                : p
                            )
                          }));
                        }}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground mt-1">
                        <span>0°</span>
                        <span>{designState.patterns.find(p => selectedPatterns.includes(p.id))?.rotation || 0}°</span>
                        <span>360°</span>
                      </div>
                    </div>
                  )}
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Position</label>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs text-muted-foreground mb-1">X</label>
                        <Input
                          type="number"
                          value={Math.round(designState.patterns.find(p => selectedPatterns.includes(p.id))?.x || 0)}
                          onChange={(e) => {
                            const newX = parseInt(e.target.value) || 0;
                            setDesignState(prev => ({
                              ...prev,
                              patterns: prev.patterns.map(p => 
                                selectedPatterns.includes(p.id) 
                                  ? { ...p, x: newX }
                                  : p
                              )
                            }));
                          }}
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-muted-foreground mb-1">Y</label>
                        <Input
                          type="number"
                          value={Math.round(designState.patterns.find(p => selectedPatterns.includes(p.id))?.y || 0)}
                          onChange={(e) => {
                            const newY = parseInt(e.target.value) || 0;
                            setDesignState(prev => ({
                              ...prev,
                              patterns: prev.patterns.map(p => 
                                selectedPatterns.includes(p.id) 
                                  ? { ...p, y: newY }
                                  : p
                              )
                            }));
                          }}
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="pt-2 border-t">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        setDesignState(prev => ({
                          ...prev,
                          patterns: prev.patterns.filter(p => 
                            !selectedPatterns.includes(p.id)
                          )
                        }));
                        setSelectedPatterns([]);
                      }}
                      className="w-full"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Selected ({selectedPatterns.length})
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Layers</CardTitle>
                <CardDescription>
                  Manage design layers
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Main Layer</span>
                  <Button variant="ghost" size="icon">
                    <Layers className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
      
      {/* Export Dialog */}
      <ExportDialog
        open={showExportDialog}
        onOpenChange={setShowExportDialog}
        patterns={designState.patterns}
        settings={designState.settings}
        canvas={canvasRef.current || undefined}
      />
    </div>
  );
};