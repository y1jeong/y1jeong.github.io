import React, { useRef, useEffect, useCallback, useState } from 'react';
import { PerforationPattern, DesignState } from '../pages/Design';

interface PreviewCanvasProps {
  designState: DesignState;
  selectedPatterns: string[];
  onPatternClick: (patternId: string, event: React.MouseEvent) => void;
  onCanvasClick: (x: number, y: number, event: React.MouseEvent) => void;
  onPanStart: (event: React.MouseEvent) => void;
  onPanMove: (event: React.MouseEvent) => void;
  onPanEnd: () => void;
  className?: string;
}

interface ViewportBounds {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

export const PreviewCanvas: React.FC<PreviewCanvasProps> = ({
  designState,
  selectedPatterns,
  onPatternClick,
  onCanvasClick,
  onPanStart,
  onPanMove,
  onPanEnd,
  className = ''
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const [isRendering, setIsRendering] = useState(false);
  const lastRenderTime = useRef<number>(0);
  const renderThrottle = 16; // ~60fps

  // Calculate viewport bounds for culling
  const getViewportBounds = useCallback((): ViewportBounds => {
    const canvas = canvasRef.current;
    if (!canvas) return { left: 0, top: 0, right: 0, bottom: 0 };

    const { zoom, panX, panY } = designState;
    const margin = 100; // Extra margin for smooth scrolling

    return {
      left: (-panX - margin) / zoom,
      top: (-panY - margin) / zoom,
      right: (canvas.width - panX + margin) / zoom,
      bottom: (canvas.height - panY + margin) / zoom
    };
  }, [designState.zoom, designState.panX, designState.panY]);

  // Check if pattern is in viewport (for culling)
  const isPatternInViewport = useCallback((pattern: PerforationPattern, bounds: ViewportBounds): boolean => {
    const margin = pattern.size / 2;
    return (
      pattern.x + margin >= bounds.left &&
      pattern.x - margin <= bounds.right &&
      pattern.y + margin >= bounds.top &&
      pattern.y - margin <= bounds.bottom
    );
  }, []);

  // Optimized grid drawing
  const drawGrid = useCallback((ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    if (!designState.showGrid) return;

    const { zoom, panX, panY } = designState;
    const gridSize = 20 * zoom;
    
    // Skip grid if too small to see
    if (gridSize < 2) return;

    const offsetX = panX % gridSize;
    const offsetY = panY % gridSize;

    ctx.strokeStyle = zoom > 0.5 ? '#e5e7eb' : '#f3f4f6';
    ctx.lineWidth = 1;
    ctx.setLineDash([]);

    ctx.beginPath();
    
    // Vertical lines
    for (let x = offsetX; x < canvas.width; x += gridSize) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
    }

    // Horizontal lines
    for (let y = offsetY; y < canvas.height; y += gridSize) {
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
    }
    
    ctx.stroke();
  }, [designState.showGrid, designState.zoom, designState.panX, designState.panY]);

  // Optimized pattern drawing with shape caching
  const drawPattern = useCallback((ctx: CanvasRenderingContext2D, pattern: PerforationPattern) => {
    const { zoom, panX, panY, showPreview } = designState;
    const x = pattern.x * zoom + panX;
    const y = pattern.y * zoom + panY;
    const size = pattern.size * zoom;

    // Skip if too small to see
    if (size < 1) return;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate((pattern.rotation * Math.PI) / 180);

    // Set style based on selection
    const isSelected = selectedPatterns.includes(pattern.id);
    if (isSelected) {
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = Math.max(1, 2 / zoom);
      ctx.fillStyle = 'rgba(59, 130, 246, 0.1)';
    } else {
      ctx.strokeStyle = '#374151';
      ctx.lineWidth = Math.max(0.5, 1 / zoom);
      ctx.fillStyle = showPreview ? '#f3f4f6' : 'transparent';
    }

    // Draw shape based on type
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

    if (showPreview || isSelected) {
      ctx.fill();
    }
    ctx.stroke();
    ctx.restore();
  }, [designState.zoom, designState.panX, designState.panY, designState.showPreview, selectedPatterns]);

  // Draw uploaded image as background
  const drawBackgroundImage = useCallback((ctx: CanvasRenderingContext2D) => {
    if (!designState.uploadedImage) return;

    const { zoom, panX, panY } = designState;
    const img = new Image();
    img.onload = () => {
      ctx.save();
      ctx.globalAlpha = 0.3; // Semi-transparent background
      ctx.drawImage(
        img,
        panX,
        panY,
        img.width * zoom,
        img.height * zoom
      );
      ctx.restore();
    };
    img.src = designState.uploadedImage.preview;
  }, [designState.uploadedImage, designState.zoom, designState.panX, designState.panY]);

  // Main render function with performance optimizations
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const now = performance.now();
    if (now - lastRenderTime.current < renderThrottle) {
      // Schedule next frame
      animationFrameRef.current = requestAnimationFrame(render);
      return;
    }

    setIsRendering(true);
    lastRenderTime.current = now;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw background image
    drawBackgroundImage(ctx);

    // Draw grid
    drawGrid(ctx, canvas);

    // Get viewport bounds for culling
    const viewportBounds = getViewportBounds();

    // Draw patterns with viewport culling
    const visiblePatterns = designState.patterns.filter((pattern: PerforationPattern) => 
      isPatternInViewport(pattern, viewportBounds)
    );

    // Batch draw patterns
    visiblePatterns.forEach((pattern: PerforationPattern) => {
      drawPattern(ctx, pattern);
    });

    // Draw performance info in debug mode
    if (process.env.NODE_ENV === 'development') {
      ctx.fillStyle = '#000';
      ctx.font = '12px monospace';
      ctx.fillText(`Patterns: ${designState.patterns.length} (${visiblePatterns.length} visible)`, 10, 20);
      ctx.fillText(`Zoom: ${Math.round(designState.zoom * 100)}%`, 10, 35);
      ctx.fillText(`Pan: ${Math.round(designState.panX)}, ${Math.round(designState.panY)}`, 10, 50);
    }

    setIsRendering(false);
  }, [designState, selectedPatterns, drawGrid, drawPattern, drawBackgroundImage, getViewportBounds, isPatternInViewport]);

  // Throttled render function
  const scheduleRender = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    animationFrameRef.current = requestAnimationFrame(render);
  }, [render]);

  // Canvas resize handler
  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const container = canvas?.parentElement;
    if (!canvas || !container) return;

    const rect = container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    
    // Set actual size in memory (scaled for high DPI)
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    
    // Scale the canvas back down using CSS
    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';
    
    // Scale the drawing context so everything draws at the correct size
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.scale(dpr, dpr);
    }
    
    scheduleRender();
  }, [scheduleRender]);

  // Mouse event handlers
  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left - designState.panX) / designState.zoom;
    const y = (e.clientY - rect.top - designState.panY) / designState.zoom;

    // Check if clicking on a pattern
    const clickedPattern = designState.patterns.find((pattern: PerforationPattern) => {
      const dx = x - pattern.x;
      const dy = y - pattern.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      return distance <= pattern.size / 2;
    });

    if (clickedPattern) {
      onPatternClick(clickedPattern.id, e);
    } else {
      onCanvasClick(x, y, e);
    }
  }, [designState.panX, designState.panY, designState.zoom, designState.patterns, onPatternClick, onCanvasClick]);

  // Effects
  useEffect(() => {
    scheduleRender();
  }, [scheduleRender]);

  useEffect(() => {
    const handleResize = () => resizeCanvas();
    window.addEventListener('resize', handleResize);
    
    // Initial resize
    const timer = setTimeout(resizeCanvas, 100);

    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timer);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [resizeCanvas]);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 cursor-crosshair w-full h-full ${className}`}
      onClick={handleCanvasClick}
      onMouseDown={onPanStart}
      onMouseMove={onPanMove}
      onMouseUp={onPanEnd}
      onMouseLeave={onPanEnd}
      onContextMenu={(e) => e.preventDefault()} // Prevent right-click context menu
      style={{
        opacity: isRendering ? 0.9 : 1,
        transition: 'opacity 0.1s ease'
      }}
    />
  );
};

export default PreviewCanvas;