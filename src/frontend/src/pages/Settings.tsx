import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { 
  Settings as SettingsIcon, 
  Palette, 
  Zap, 
  Shield, 
  Database, 
  Download, 
  Upload, 
  RefreshCw, 
  Save, 
  AlertTriangle, 
  CheckCircle, 
  Info, 
  Grid, 
  Ruler, 
  MousePointer
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AppSettings {
  language: string;
  timezone: string;
  dateFormat: string;
  numberFormat: string;
  defaultUnits: 'metric' | 'imperial';
  autoSave: boolean;
  autoSaveInterval: number;
  gridSnap: boolean;
  showGrid: boolean;
  showRulers: boolean;
  showTooltips: boolean;
  soundEffects: boolean;
  animations: boolean;
  highContrast: boolean;
  reducedMotion: boolean;
}

interface PerformanceSettings {
  renderQuality: 'low' | 'medium' | 'high';
  maxUndoSteps: number;
  previewResolution: 'low' | 'medium' | 'high';
  enableGPUAcceleration: boolean;
  cacheSize: number;
  backgroundProcessing: boolean;
}

interface ExportSettings {
  defaultFormat: string;
  defaultQuality: number;
  includeMetadata: boolean;
  compressFiles: boolean;
  watermark: boolean;
  watermarkText: string;
  watermarkOpacity: number;
}

type SettingsTab = 'general' | 'appearance' | 'performance' | 'export' | 'advanced';

export const Settings: React.FC = () => {
  const { user } = useAuth();
  const { } = useTheme();
  
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const [appSettings, setAppSettings] = useState<AppSettings>({
    language: 'en',
    timezone: 'UTC',
    dateFormat: 'MM/DD/YYYY',
    numberFormat: 'en-US',
    defaultUnits: 'metric',
    autoSave: true,
    autoSaveInterval: 5,
    gridSnap: true,
    showGrid: true,
    showRulers: true,
    showTooltips: true,
    soundEffects: true,
    animations: true,
    highContrast: false,
    reducedMotion: false
  });
  
  const [performanceSettings, setPerformanceSettings] = useState<PerformanceSettings>({
    renderQuality: 'high',
    maxUndoSteps: 50,
    previewResolution: 'medium',
    enableGPUAcceleration: true,
    cacheSize: 100,
    backgroundProcessing: true
  });
  
  const [exportSettings, setExportSettings] = useState<ExportSettings>({
    defaultFormat: 'PNG',
    defaultQuality: 90,
    includeMetadata: true,
    compressFiles: false,
    watermark: false,
    watermarkText: (user?.firstName && user?.lastName) ? `${user.firstName} ${user.lastName}` : 'Wight & Company',
    watermarkOpacity: 50
  });

  const handleSaveSettings = async () => {
    setIsLoading(true);
    
    try {
      // TODO: Implement settings save to backend
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      
      setSuccessMessage('Settings saved successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Failed to save settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetSettings = () => {
    if (window.confirm('Are you sure you want to reset all settings to default values?')) {
      // Reset to default values
      setAppSettings({
        language: 'en',
        timezone: 'UTC',
        dateFormat: 'MM/DD/YYYY',
        numberFormat: 'en-US',
        defaultUnits: 'metric',
        autoSave: true,
        autoSaveInterval: 5,
        gridSnap: true,
        showGrid: true,
        showRulers: true,
        showTooltips: true,
        soundEffects: true,
        animations: true,
        highContrast: false,
        reducedMotion: false
      });
      
      setPerformanceSettings({
        renderQuality: 'high',
        maxUndoSteps: 50,
        previewResolution: 'medium',
        enableGPUAcceleration: true,
        cacheSize: 100,
        backgroundProcessing: true
      });
      
      setExportSettings({
        defaultFormat: 'PNG',
        defaultQuality: 90,
        includeMetadata: true,
        compressFiles: false,
        watermark: false,
        watermarkText: (user?.firstName && user?.lastName) ? `${user.firstName} ${user.lastName}` : 'Wight & Company',
        watermarkOpacity: 50
      });
      
      setSuccessMessage('Settings reset to defaults!');
      setTimeout(() => setSuccessMessage(''), 3000);
    }
  };

  const handleExportSettings = () => {
    const settings = {
      app: appSettings,
      performance: performanceSettings,
      export: exportSettings
    };
    
    const blob = new Blob([JSON.stringify(settings, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'rhino-settings.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportSettings = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const settings = JSON.parse(event.target?.result as string);
        
        if (settings.app) setAppSettings(settings.app);
        if (settings.performance) setPerformanceSettings(settings.performance);
        if (settings.export) setExportSettings(settings.export);
        
        setSuccessMessage('Settings imported successfully!');
        setTimeout(() => setSuccessMessage(''), 3000);
      } catch (error) {
        console.error('Failed to import settings:', error);
      }
    };
    reader.readAsText(file);
  };

  const handleClearCache = () => {
    if (window.confirm('Are you sure you want to clear the application cache?')) {
      // TODO: Implement cache clearing
      localStorage.clear();
      sessionStorage.clear();
      
      setSuccessMessage('Cache cleared successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    }
  };

  const tabs = [
    { id: 'general', label: 'General', icon: SettingsIcon },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'performance', label: 'Performance', icon: Zap },
    { id: 'export', label: 'Export', icon: Download },
    { id: 'advanced', label: 'Advanced', icon: Shield }
  ];

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Application Settings</h1>
        <p className="text-muted-foreground mt-2">
          Configure your application preferences and behavior
        </p>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md flex items-center">
          <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
          <span className="text-green-800">{successMessage}</span>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Navigation */}
        <div className="lg:w-64">
          <nav className="space-y-1">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as SettingsTab)}
                  className={cn(
                    'w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                    activeTab === tab.id
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                  )}
                >
                  <Icon className="h-4 w-4 mr-3" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
          
          {/* Action Buttons */}
          <div className="mt-8 space-y-2">
            <Button 
              onClick={handleSaveSettings} 
              disabled={isLoading}
              className="w-full"
            >
              <Save className="h-4 w-4 mr-2" />
              Save All Settings
            </Button>
            
            <Button 
              variant="outline" 
              onClick={handleResetSettings}
              className="w-full"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Reset to Defaults
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          {/* General Tab */}
          {activeTab === 'general' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Language & Region</CardTitle>
                  <CardDescription>
                    Configure language, timezone, and regional settings
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Language</label>
                      <select
                        value={appSettings.language}
                        onChange={(e) => setAppSettings(prev => ({ ...prev, language: e.target.value }))}
                        className="w-full p-2 border rounded-md"
                      >
                        <option value="en">English</option>
                        <option value="es">Español</option>
                        <option value="fr">Français</option>
                        <option value="de">Deutsch</option>
                        <option value="zh">中文</option>
                        <option value="ja">日本語</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2">Timezone</label>
                      <select
                        value={appSettings.timezone}
                        onChange={(e) => setAppSettings(prev => ({ ...prev, timezone: e.target.value }))}
                        className="w-full p-2 border rounded-md"
                      >
                        <option value="UTC">UTC</option>
                        <option value="America/New_York">Eastern Time</option>
                        <option value="America/Chicago">Central Time</option>
                        <option value="America/Denver">Mountain Time</option>
                        <option value="America/Los_Angeles">Pacific Time</option>
                        <option value="Europe/London">London</option>
                        <option value="Europe/Paris">Paris</option>
                        <option value="Asia/Tokyo">Tokyo</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Date Format</label>
                      <select
                        value={appSettings.dateFormat}
                        onChange={(e) => setAppSettings(prev => ({ ...prev, dateFormat: e.target.value }))}
                        className="w-full p-2 border rounded-md"
                      >
                        <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                        <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                        <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                        <option value="DD MMM YYYY">DD MMM YYYY</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2">Default Units</label>
                      <select
                        value={appSettings.defaultUnits}
                        onChange={(e) => setAppSettings(prev => ({ ...prev, defaultUnits: e.target.value as 'metric' | 'imperial' }))}
                        className="w-full p-2 border rounded-md"
                      >
                        <option value="metric">Metric (mm, cm, m)</option>
                        <option value="imperial">Imperial (in, ft)</option>
                      </select>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Auto-Save</CardTitle>
                  <CardDescription>
                    Configure automatic saving behavior
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Enable Auto-Save</h4>
                      <p className="text-sm text-muted-foreground">
                        Automatically save your work at regular intervals
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={appSettings.autoSave}
                      onChange={(e) => setAppSettings(prev => ({ ...prev, autoSave: e.target.checked }))}
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                  </div>
                  
                  {appSettings.autoSave && (
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Auto-Save Interval (minutes)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="60"
                        value={appSettings.autoSaveInterval}
                        onChange={(e) => setAppSettings(prev => ({ ...prev, autoSaveInterval: parseInt(e.target.value) }))}
                        className="w-32 p-2 border rounded-md"
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Appearance Tab */}
          {activeTab === 'appearance' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Interface</CardTitle>
                  <CardDescription>
                    Customize the appearance of the design interface
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    {
                      key: 'showGrid',
                      label: 'Show Grid',
                      description: 'Display grid lines in the design canvas',
                      icon: Grid
                    },
                    {
                      key: 'gridSnap',
                      label: 'Grid Snap',
                      description: 'Snap objects to grid points',
                      icon: MousePointer
                    },
                    {
                      key: 'showRulers',
                      label: 'Show Rulers',
                      description: 'Display rulers around the canvas',
                      icon: Ruler
                    },
                    {
                      key: 'showTooltips',
                      label: 'Show Tooltips',
                      description: 'Display helpful tooltips on hover',
                      icon: Info
                    }
                  ].map(({ key, label, description, icon: Icon }) => (
                    <div key={key} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Icon className="h-4 w-4 mr-3 text-muted-foreground" />
                        <div>
                          <h4 className="font-medium">{label}</h4>
                          <p className="text-sm text-muted-foreground">{description}</p>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={appSettings[key as keyof AppSettings] as boolean}
                        onChange={(e) => setAppSettings(prev => ({ ...prev, [key]: e.target.checked }))}
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                      />
                    </div>
                  ))}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Accessibility</CardTitle>
                  <CardDescription>
                    Settings to improve accessibility and usability
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    {
                      key: 'highContrast',
                      label: 'High Contrast',
                      description: 'Use high contrast colors for better visibility'
                    },
                    {
                      key: 'reducedMotion',
                      label: 'Reduced Motion',
                      description: 'Minimize animations and transitions'
                    },
                    {
                      key: 'soundEffects',
                      label: 'Sound Effects',
                      description: 'Play sound effects for actions'
                    },
                    {
                      key: 'animations',
                      label: 'Animations',
                      description: 'Enable smooth animations and transitions'
                    }
                  ].map(({ key, label, description }) => (
                    <div key={key} className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">{label}</h4>
                        <p className="text-sm text-muted-foreground">{description}</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={appSettings[key as keyof AppSettings] as boolean}
                        onChange={(e) => setAppSettings(prev => ({ ...prev, [key]: e.target.checked }))}
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                      />
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Performance Tab */}
          {activeTab === 'performance' && (
            <Card>
              <CardHeader>
                <CardTitle>Performance Settings</CardTitle>
                <CardDescription>
                  Optimize application performance for your system
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Render Quality</label>
                    <select
                      value={performanceSettings.renderQuality}
                      onChange={(e) => setPerformanceSettings(prev => ({ ...prev, renderQuality: e.target.value as 'low' | 'medium' | 'high' }))}
                      className="w-full p-2 border rounded-md"
                    >
                      <option value="low">Low (Better Performance)</option>
                      <option value="medium">Medium (Balanced)</option>
                      <option value="high">High (Better Quality)</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Preview Resolution</label>
                    <select
                      value={performanceSettings.previewResolution}
                      onChange={(e) => setPerformanceSettings(prev => ({ ...prev, previewResolution: e.target.value as 'low' | 'medium' | 'high' }))}
                      className="w-full p-2 border rounded-md"
                    >
                      <option value="low">Low (Faster)</option>
                      <option value="medium">Medium</option>
                      <option value="high">High (Slower)</option>
                    </select>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Max Undo Steps ({performanceSettings.maxUndoSteps})
                    </label>
                    <input
                      type="range"
                      min="10"
                      max="100"
                      value={performanceSettings.maxUndoSteps}
                      onChange={(e) => setPerformanceSettings(prev => ({ ...prev, maxUndoSteps: parseInt(e.target.value) }))}
                      className="w-full"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Cache Size ({performanceSettings.cacheSize} MB)
                    </label>
                    <input
                      type="range"
                      min="50"
                      max="500"
                      step="50"
                      value={performanceSettings.cacheSize}
                      onChange={(e) => setPerformanceSettings(prev => ({ ...prev, cacheSize: parseInt(e.target.value) }))}
                      className="w-full"
                    />
                  </div>
                </div>
                
                <div className="space-y-4">
                  {[
                    {
                      key: 'enableGPUAcceleration',
                      label: 'GPU Acceleration',
                      description: 'Use GPU for faster rendering (requires restart)'
                    },
                    {
                      key: 'backgroundProcessing',
                      label: 'Background Processing',
                      description: 'Process tasks in the background for better responsiveness'
                    }
                  ].map(({ key, label, description }) => (
                    <div key={key} className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">{label}</h4>
                        <p className="text-sm text-muted-foreground">{description}</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={performanceSettings[key as keyof PerformanceSettings] as boolean}
                        onChange={(e) => setPerformanceSettings(prev => ({ ...prev, [key]: e.target.checked }))}
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Export Tab */}
          {activeTab === 'export' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Default Export Settings</CardTitle>
                  <CardDescription>
                    Configure default settings for exporting designs
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Default Format</label>
                      <select
                        value={exportSettings.defaultFormat}
                        onChange={(e) => setExportSettings(prev => ({ ...prev, defaultFormat: e.target.value }))}
                        className="w-full p-2 border rounded-md"
                      >
                        <option value="PNG">PNG</option>
                        <option value="JPG">JPG</option>
                        <option value="SVG">SVG</option>
                        <option value="PDF">PDF</option>
                        <option value="DXF">DXF</option>
                        <option value="STL">STL</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Quality ({exportSettings.defaultQuality}%)
                      </label>
                      <input
                        type="range"
                        min="10"
                        max="100"
                        value={exportSettings.defaultQuality}
                        onChange={(e) => setExportSettings(prev => ({ ...prev, defaultQuality: parseInt(e.target.value) }))}
                        className="w-full"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    {[
                      {
                        key: 'includeMetadata',
                        label: 'Include Metadata',
                        description: 'Include design information in exported files'
                      },
                      {
                        key: 'compressFiles',
                        label: 'Compress Files',
                        description: 'Compress exported files to reduce size'
                      }
                    ].map(({ key, label, description }) => (
                      <div key={key} className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{label}</h4>
                          <p className="text-sm text-muted-foreground">{description}</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={exportSettings[key as keyof ExportSettings] as boolean}
                          onChange={(e) => setExportSettings(prev => ({ ...prev, [key]: e.target.checked }))}
                          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Watermark Settings</CardTitle>
                  <CardDescription>
                    Add watermarks to exported designs
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Enable Watermark</h4>
                      <p className="text-sm text-muted-foreground">
                        Add a watermark to exported designs
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={exportSettings.watermark}
                      onChange={(e) => setExportSettings(prev => ({ ...prev, watermark: e.target.checked }))}
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                  </div>
                  
                  {exportSettings.watermark && (
                    <div className="space-y-4">
                      <Input
                        label="Watermark Text"
                        value={exportSettings.watermarkText}
                        onChange={(e) => setExportSettings(prev => ({ ...prev, watermarkText: e.target.value }))}
                      />
                      
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Opacity ({exportSettings.watermarkOpacity}%)
                        </label>
                        <input
                          type="range"
                          min="10"
                          max="100"
                          value={exportSettings.watermarkOpacity}
                          onChange={(e) => setExportSettings(prev => ({ ...prev, watermarkOpacity: parseInt(e.target.value) }))}
                          className="w-full"
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Advanced Tab */}
          {activeTab === 'advanced' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Settings Management</CardTitle>
                  <CardDescription>
                    Import, export, and manage your settings
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button variant="outline" onClick={handleExportSettings}>
                      <Download className="h-4 w-4 mr-2" />
                      Export Settings
                    </Button>
                    
                    <div>
                      <input
                        type="file"
                        accept=".json"
                        onChange={handleImportSettings}
                        className="hidden"
                        id="import-settings"
                      />
                      <Button 
                        variant="outline" 
                        onClick={() => document.getElementById('import-settings')?.click()}
                        className="w-full"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Import Settings
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Cache & Storage</CardTitle>
                  <CardDescription>
                    Manage application cache and storage
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-md">
                    <div>
                      <h4 className="font-medium">Clear Cache</h4>
                      <p className="text-sm text-muted-foreground">
                        Clear application cache to free up space
                      </p>
                    </div>
                    <Button variant="outline" onClick={handleClearCache}>
                      <Database className="h-4 w-4 mr-2" />
                      Clear Cache
                    </Button>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-red-600">Danger Zone</CardTitle>
                  <CardDescription>
                    Irreversible actions that affect your data
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between p-4 border border-red-200 rounded-md bg-red-50">
                    <div>
                      <h4 className="font-medium text-red-800">Reset All Settings</h4>
                      <p className="text-sm text-red-600">
                        Reset all settings to their default values
                      </p>
                    </div>
                    <Button variant="destructive" onClick={handleResetSettings}>
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      Reset All
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};