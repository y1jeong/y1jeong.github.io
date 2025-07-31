// Deployment configuration for different environments

export const DEPLOYMENT_CONFIG = {
  // GitHub Pages deployment (static mode)
  GITHUB_PAGES: {
    API_BASE_URL: '', // No backend API in static mode
    FEATURES: {
      USER_AUTHENTICATION: false,
      CLOUD_STORAGE: false,
      REAL_TIME_COLLABORATION: false,
      ADVANCED_ANALYTICS: false,
      FILE_UPLOAD_TO_SERVER: false
    },
    STORAGE: {
      USE_LOCAL_STORAGE: true,
      USE_INDEXED_DB: true
    }
  },
  
  // Local development with backend
  LOCAL_DEV: {
    API_BASE_URL: 'http://localhost:5000/api',
    FEATURES: {
      USER_AUTHENTICATION: true,
      CLOUD_STORAGE: true,
      REAL_TIME_COLLABORATION: true,
      ADVANCED_ANALYTICS: true,
      FILE_UPLOAD_TO_SERVER: true
    },
    STORAGE: {
      USE_LOCAL_STORAGE: true,
      USE_INDEXED_DB: true
    }
  },
  
  // Production with backend
  PRODUCTION: {
    API_BASE_URL: process.env.VITE_API_BASE_URL || '/api',
    FEATURES: {
      USER_AUTHENTICATION: true,
      CLOUD_STORAGE: true,
      REAL_TIME_COLLABORATION: true,
      ADVANCED_ANALYTICS: true,
      FILE_UPLOAD_TO_SERVER: true
    },
    STORAGE: {
      USE_LOCAL_STORAGE: true,
      USE_INDEXED_DB: true
    }
  }
};

// Determine current deployment mode
const getDeploymentMode = (): keyof typeof DEPLOYMENT_CONFIG => {
  // Check if we're in GitHub Pages (no backend available)
  if (window.location.hostname.includes('github.io')) {
    return 'GITHUB_PAGES';
  }
  
  // Check if we're in local development
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'LOCAL_DEV';
  }
  
  // Default to production
  return 'PRODUCTION';
};

export const CURRENT_DEPLOYMENT = getDeploymentMode();
export const CONFIG = DEPLOYMENT_CONFIG[CURRENT_DEPLOYMENT];

// Helper functions
export const isStaticDeployment = () => CURRENT_DEPLOYMENT === 'GITHUB_PAGES';
export const hasBackend = () => !isStaticDeployment();
export const canUseFeature = (feature: keyof typeof CONFIG.FEATURES) => CONFIG.FEATURES[feature];