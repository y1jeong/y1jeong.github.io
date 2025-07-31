// Static API service for GitHub Pages deployment
// Provides local storage-based functionality when no backend is available

import { isStaticDeployment } from '../config/deployment';

// Types for local storage data
interface StoredProject {
  id: string;
  name: string;
  description: string;
  imageData?: string;
  perforationData?: any;
  settings?: any;
  createdAt: string;
  updatedAt: string;
}

interface StoredSettings {
  theme: 'light' | 'dark' | 'system';
  units: 'mm' | 'inches';
  precision: number;
  autoSave: boolean;
  gridSize: number;
  snapToGrid: boolean;
}

class StaticApiService {
  private readonly STORAGE_KEYS = {
    PROJECTS: 'wight-company-projects',
    SETTINGS: 'wight-company-settings',
    USER_PREFERENCES: 'wight-company-preferences'
  };

  // Project Management
  async getProjects(): Promise<StoredProject[]> {
    if (!isStaticDeployment()) {
      throw new Error('Static API should only be used in static deployment');
    }

    const stored = localStorage.getItem(this.STORAGE_KEYS.PROJECTS);
    return stored ? JSON.parse(stored) : [];
  }

  async saveProject(project: Omit<StoredProject, 'id' | 'createdAt' | 'updatedAt'>): Promise<StoredProject> {
    const projects = await this.getProjects();
    const newProject: StoredProject = {
      ...project,
      id: this.generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    projects.push(newProject);
    localStorage.setItem(this.STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
    return newProject;
  }

  async updateProject(id: string, updates: Partial<StoredProject>): Promise<StoredProject> {
    const projects = await this.getProjects();
    const index = projects.findIndex(p => p.id === id);
    
    if (index === -1) {
      throw new Error('Project not found');
    }

    projects[index] = {
      ...projects[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    localStorage.setItem(this.STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
    return projects[index];
  }

  async deleteProject(id: string): Promise<void> {
    const projects = await this.getProjects();
    const filtered = projects.filter(p => p.id !== id);
    localStorage.setItem(this.STORAGE_KEYS.PROJECTS, JSON.stringify(filtered));
  }

  async getProject(id: string): Promise<StoredProject | null> {
    const projects = await this.getProjects();
    return projects.find(p => p.id === id) || null;
  }

  // Settings Management
  async getSettings(): Promise<StoredSettings> {
    const stored = localStorage.getItem(this.STORAGE_KEYS.SETTINGS);
    const defaultSettings: StoredSettings = {
      theme: 'system',
      units: 'mm',
      precision: 2,
      autoSave: true,
      gridSize: 10,
      snapToGrid: true
    };

    return stored ? { ...defaultSettings, ...JSON.parse(stored) } : defaultSettings;
  }

  async updateSettings(settings: Partial<StoredSettings>): Promise<StoredSettings> {
    const current = await this.getSettings();
    const updated = { ...current, ...settings };
    localStorage.setItem(this.STORAGE_KEYS.SETTINGS, JSON.stringify(updated));
    return updated;
  }

  // File Export (client-side only)
  async exportProject(project: StoredProject, format: 'json' | 'svg' | 'dxf' | 'png'): Promise<Blob> {
    switch (format) {
      case 'json':
        return new Blob([JSON.stringify(project, null, 2)], { type: 'application/json' });
      
      case 'svg':
        // Generate SVG from perforation data
        const svg = this.generateSVG(project.perforationData);
        return new Blob([svg], { type: 'image/svg+xml' });
      
      case 'dxf':
        // Generate DXF from perforation data
        const dxf = this.generateDXF(project.perforationData);
        return new Blob([dxf], { type: 'application/dxf' });
      
      case 'png':
        // Generate PNG from canvas (would need canvas reference)
        throw new Error('PNG export requires canvas rendering - use canvas.toBlob() directly');
      
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  // Import Project
  async importProject(file: File): Promise<StoredProject> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = JSON.parse(e.target?.result as string);
          const project = await this.saveProject({
            name: data.name || 'Imported Project',
            description: data.description || 'Imported from file',
            imageData: data.imageData,
            perforationData: data.perforationData,
            settings: data.settings
          });
          resolve(project);
        } catch (error) {
          reject(new Error('Invalid project file format'));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }

  // Utility Methods
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private generateSVG(perforationData: any): string {
    if (!perforationData || !perforationData.perforations) {
      return '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"></svg>';
    }

    const { width = 100, height = 100, perforations = [] } = perforationData;
    
    let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">\n`;
    
    perforations.forEach((perf: any) => {
      svg += `  <circle cx="${perf.x}" cy="${perf.y}" r="${perf.radius || 1}" fill="black" />\n`;
    });
    
    svg += '</svg>';
    return svg;
  }

  private generateDXF(perforationData: any): string {
    if (!perforationData || !perforationData.perforations) {
      return this.getBasicDXF();
    }

    const { perforations = [] } = perforationData;
    
    let dxf = this.getDXFHeader();
    
    perforations.forEach((perf: any) => {
      dxf += this.getDXFCircle(perf.x || 0, perf.y || 0, perf.radius || 1);
    });
    
    dxf += this.getDXFFooter();
    return dxf;
  }

  private getBasicDXF(): string {
    return this.getDXFHeader() + this.getDXFFooter();
  }

  private getDXFHeader(): string {
    return `0\nSECTION\n2\nHEADER\n0\nENDSEC\n0\nSECTION\n2\nENTITIES\n`;
  }

  private getDXFFooter(): string {
    return `0\nENDSEC\n0\nEOF\n`;
  }

  private getDXFCircle(x: number, y: number, radius: number): string {
    return `0\nCIRCLE\n8\n0\n10\n${x}\n20\n${y}\n40\n${radius}\n`;
  }

  // Data Migration and Cleanup
  async clearAllData(): Promise<void> {
    Object.values(this.STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
  }

  async getStorageUsage(): Promise<{ used: number; available: number }> {
    let used = 0;
    Object.values(this.STORAGE_KEYS).forEach(key => {
      const item = localStorage.getItem(key);
      if (item) {
        used += item.length;
      }
    });

    // Estimate available storage (localStorage typically has 5-10MB limit)
    const estimated = 5 * 1024 * 1024; // 5MB estimate
    return {
      used,
      available: Math.max(0, estimated - used)
    };
  }
}

export const staticApi = new StaticApiService();
export default staticApi;