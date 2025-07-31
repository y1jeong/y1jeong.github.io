// User and Authentication Types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: UserRole[];
  isActive: boolean;
  isVerified: boolean;
  lastLogin?: Date;
  preferences: UserPreferences;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserPreferences {
  units: 'inches' | 'mm';
  defaultPanelSize: {
    width: number;
    height: number;
  };
  defaultPerforation: {
    minSize: number;
    maxSize: number;
    shape: PerforationShape;
    pattern: PerforationPattern;
    spacing: {
      horizontal: number;
      diagonal: number;
    };
  };
  theme: 'light' | 'dark' | 'system';
  autoSave: boolean;
  showGrid: boolean;
  showRuler: boolean;
}

export type UserRole = 'user' | 'premium' | 'admin';

export interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterData {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  acceptTerms: boolean;
}

// Design and Panel Types
export interface Design {
  id: string;
  name: string;
  description?: string;
  userId: string;
  panelSize: PanelDimensions;
  perforationSettings: PerforationSettings;
  imageSettings?: ImageSettings;
  exportSettings?: ExportSettings;
  metadata: DesignMetadata;
  isPublic: boolean;
  tags: string[];
  version: number;
  versions?: DesignVersion[];
  createdAt: Date;
  updatedAt: Date;
}

export interface DesignVersion {
  version: number;
  changes: string;
  createdAt: Date;
  panelSize: PanelDimensions;
  perforationSettings: PerforationSettings;
}

export interface DesignMetadata {
  views: number;
  downloads: number;
  likes: number;
  totalPerforations: number;
  totalArea: number;
  perforationCoverage: number;
  estimatedCutTime?: number;
  materialUsage?: number;
}

export interface PanelDimensions {
  width: number;
  height: number;
  thickness?: number;
  units: 'inches' | 'mm';
}

// Perforation Types
export interface PerforationSettings {
  minSize: number;
  maxSize: number;
  shape: PerforationShape;
  pattern: PerforationPattern;
  spacing: PerforationSpacing;
  rotation?: number;
  density: number;
  distribution: 'uniform' | 'image-based' | 'custom';
  customPoints?: Point[];
}

export interface PerforationSpacing {
  horizontal: number;
  diagonal: number;
  variation?: number; // Random variation percentage
}

export type PerforationShape = 
  | 'circle' 
  | 'square' 
  | 'rectangle' 
  | 'hexagon' 
  | 'triangle' 
  | 'diamond' 
  | 'oval' 
  | 'custom';

export type PerforationPattern = 
  | 'grid' 
  | 'staggered' 
  | 'random' 
  | 'radial' 
  | 'spiral' 
  | 'organic' 
  | 'custom';

export interface Perforation {
  id: string;
  position: Point;
  size: number;
  shape: PerforationShape;
  rotation?: number;
  opacity?: number;
}

export interface Point {
  x: number;
  y: number;
}

// Image Processing Types
export interface ImageData {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  dimensions: {
    width: number;
    height: number;
  };
  url: string;
  thumbnailUrl?: string;
  processedUrl?: string;
  analysis?: ImageAnalysis;
  uploadedAt: Date;
}

export interface ImageAnalysis {
  histogram: {
    red: number[];
    green: number[];
    blue: number[];
    gray: number[];
  };
  statistics: {
    mean: number;
    median: number;
    std: number;
    min: number;
    max: number;
  };
  contrast: number;
  brightness: number;
  complexity: number;
  dominantColors: string[];
  edgeMap?: number[][];
  grayscaleMap: number[][];
}

export interface ImageSettings {
  brightness: number;
  contrast: number;
  gamma: number;
  blur: number;
  invert: boolean;
  grayscale: boolean;
  threshold?: number;
  edgeDetection?: boolean;
}

// Export Types
export interface ExportSettings {
  format: ExportFormat;
  units: 'inches' | 'mm';
  scale: number;
  includeOutline: boolean;
  includeDimensions: boolean;
  includeMetadata: boolean;
  layerSettings?: LayerSettings;
  pdfSettings?: PDFSettings;
  dxfSettings?: DXFSettings;
}

export type ExportFormat = 'dxf' | 'svg' | 'pdf' | 'png' | 'jpg';

export interface LayerSettings {
  outlineLayer: string;
  perforationLayer: string;
  dimensionLayer: string;
  textLayer: string;
}

export interface PDFSettings {
  pageSize: 'A4' | 'A3' | 'Letter' | 'Tabloid' | 'custom';
  orientation: 'portrait' | 'landscape';
  margin: number;
  showGrid: boolean;
  showRuler: boolean;
}

export interface DXFSettings {
  version: '2000' | '2004' | '2007' | '2010' | '2013' | '2018';
  precision: number;
  usePolylines: boolean;
  groupByLayer: boolean;
}

export interface ExportResult {
  id: string;
  filename: string;
  format: ExportFormat;
  size: number;
  downloadUrl: string;
  settings: ExportSettings;
  statistics: {
    panelArea: number;
    perforationCount: number;
    fileSize: number;
    generationTime: number;
  };
  generatedAt: Date;
}

// Canvas and Viewport Types
export interface ViewportState {
  zoom: number;
  pan: Point;
  rotation: number;
  showGrid: boolean;
  showRuler: boolean;
  showPerforations: boolean;
  showImage: boolean;
  gridSize: number;
  snapToGrid: boolean;
}

export interface CanvasSettings {
  width: number;
  height: number;
  pixelsPerInch: number;
  backgroundColor: string;
  gridColor: string;
  rulerColor: string;
  perforationColor: string;
  outlineColor: string;
}

// UI State Types
export interface UIState {
  sidebarOpen: boolean;
  activePanel: 'image' | 'perforation' | 'export' | 'settings';
  selectedTool: 'select' | 'pan' | 'zoom' | 'measure';
  showPreview: boolean;
  isProcessing: boolean;
  notifications: Notification[];
}

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
  actions?: NotificationAction[];
  createdAt: Date;
}

export interface NotificationAction {
  label: string;
  action: () => void;
  variant?: 'default' | 'destructive';
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  errors?: ValidationError[];
}

export interface ValidationError {
  field: string;
  message: string;
  code?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Form Types
export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'number' | 'select' | 'checkbox' | 'file' | 'textarea';
  placeholder?: string;
  required?: boolean;
  validation?: ValidationRule[];
  options?: SelectOption[];
  min?: number;
  max?: number;
  step?: number;
  accept?: string; // For file inputs
}

export interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

export interface ValidationRule {
  type: 'required' | 'email' | 'min' | 'max' | 'pattern' | 'custom';
  value?: any;
  message: string;
}

// Statistics and Analytics Types
export interface DesignStatistics {
  totalDesigns: number;
  publicDesigns: number;
  totalViews: number;
  totalDownloads: number;
  averageRating: number;
  popularShapes: Array<{ shape: PerforationShape; count: number }>;
  popularPatterns: Array<{ pattern: PerforationPattern; count: number }>;
  recentActivity: DesignActivity[];
}

export interface DesignActivity {
  id: string;
  type: 'created' | 'updated' | 'published' | 'downloaded' | 'liked';
  designId: string;
  designName: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

// Error Types
export interface AppError {
  code: string;
  message: string;
  details?: any;
  timestamp: Date;
  userId?: string;
  context?: Record<string, any>;
}

// Theme Types
export interface Theme {
  name: string;
  colors: {
    primary: string;
    secondary: string;
    background: string;
    foreground: string;
    muted: string;
    accent: string;
    destructive: string;
    border: string;
    input: string;
    ring: string;
  };
  fonts: {
    sans: string;
    mono: string;
  };
  spacing: Record<string, string>;
  borderRadius: Record<string, string>;
}

// Utility Types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

export type Timestamp = string | Date;

export type ID = string;

// Event Types
export interface CanvasEvent {
  type: 'click' | 'drag' | 'zoom' | 'pan' | 'select';
  position: Point;
  target?: string;
  modifiers?: {
    shift: boolean;
    ctrl: boolean;
    alt: boolean;
  };
}

export interface KeyboardEvent {
  key: string;
  code: string;
  modifiers: {
    shift: boolean;
    ctrl: boolean;
    alt: boolean;
    meta: boolean;
  };
}

// File Upload Types
export interface FileUpload {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'processing' | 'completed' | 'error';
  error?: string;
  result?: ImageData;
}

export interface UploadOptions {
  maxSize: number;
  allowedTypes: string[];
  quality?: number;
  resize?: {
    width: number;
    height: number;
    fit: 'cover' | 'contain' | 'fill';
  };
}

// Performance Types
export interface PerformanceMetrics {
  renderTime: number;
  perforationCount: number;
  memoryUsage: number;
  canvasSize: {
    width: number;
    height: number;
  };
  fps?: number;
}

// Feature Flags
export interface FeatureFlags {
  enableAdvancedShapes: boolean;
  enableBatchExport: boolean;
  enableCollaboration: boolean;
  enableAnalytics: boolean;
  enableOfflineMode: boolean;
  maxPerforations: number;
  maxFileSize: number;
}