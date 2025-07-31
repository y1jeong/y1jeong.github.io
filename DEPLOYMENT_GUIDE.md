# Deployment Guide - y1jeong.github.io

## Overview
This guide explains how to deploy the RhinoPerforatedWall project to the `github.com/y1jeong/y1jeong.github.io` repository using GitHub Pages.

## Prerequisites
- GitHub repository `y1jeong/y1jeong.github.io` (public)
- Node.js 18+ installed locally
- Git configured with your GitHub credentials

## Deployment Steps

### Step 1: Repository Setup
1. Clone or copy this project to the y1jeong.github.io repository:
   ```bash
   git clone https://github.com/y1jeong/y1jeong.github.io.git
   cd y1jeong.github.io
   ```

2. Copy the frontend application:
   ```bash
   # Copy the entire src/frontend directory
   cp -r /path/to/RhinoPerforatedWall/src/frontend/* .
   
   # Copy the GitHub Actions workflow
   mkdir -p .github/workflows
   cp /path/to/RhinoPerforatedWall/.github/workflows/deploy.yml .github/workflows/
   ```

### Step 2: Configuration Updates
The following files have been pre-configured for y1jeong.github.io deployment:

#### ✅ vite.config.ts
- Base path set to `/` for production (root domain)
- Build optimization configured
- Path aliases set up

#### ✅ package.json
- `build:github` script configured for root deployment
- All dependencies included

#### ✅ GitHub Actions Workflow
- Automated deployment on push to main/master
- Node.js 18 environment
- Builds from `src/frontend` directory

### Step 3: Enable GitHub Pages
1. Go to your repository settings: `https://github.com/y1jeong/y1jeong.github.io/settings`
2. Navigate to "Pages" in the left sidebar
3. Under "Source", select "GitHub Actions"
4. Save the settings

### Step 4: Deploy
1. Commit and push your changes:
   ```bash
   git add .
   git commit -m "Initial deployment setup for y1jeong.github.io"
   git push origin main
   ```

2. The GitHub Actions workflow will automatically:
   - Install dependencies
   - Build the application
   - Deploy to GitHub Pages

### Step 5: Access Your Application
Once deployed, your application will be available at:
**https://y1jeong.github.io/**

## Project Features
The deployed application includes:

### 🎨 Design Studio
- **Image Upload**: Drag-and-drop halftone pattern images (JPEG, PNG, SVG)
- **Real-time Processing**: Automatic grayscale analysis and perforation generation
- **Interactive Canvas**: Zoom, pan, rotate with mouse/touch controls
- **Pattern Customization**: Adjustable size, spacing, density, and distribution

### 🔧 Advanced Controls
- **Perforation Shapes**: Circles, rectangles, polygons, custom vectors
- **Distribution Patterns**: Grid, staggered, random, radial
- **Parameter Controls**: Min/max size, spacing, rotation, snap-to-grid
- **Real-time Preview**: Instant visual feedback with performance optimization

### 📁 Export Capabilities
- **Multiple Formats**: SVG, DXF, PDF, PNG for CNC/laser cutting
- **Unit Conversion**: Imperial (inches) and metric (mm, cm) support
- **Configurable Settings**: Scale, precision, grid inclusion options

### 📱 Responsive Design
- **Cross-platform**: Desktop, tablet, mobile optimized
- **Modern UI**: Tailwind CSS with Radix UI components
- **Accessibility**: ARIA labels and keyboard navigation

## Technical Stack
- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + Radix UI
- **Canvas**: Konva.js + Fabric.js for advanced graphics
- **State Management**: React Query + Zustand
- **Build Tool**: Vite with optimized chunking
- **Deployment**: GitHub Pages with automated CI/CD

## Development Mode
For local development:
```bash
npm install
npm run dev
```
Access at: http://localhost:3000

## Build for Production
```bash
# Standard build
npm run build

# GitHub Pages build (with correct base path)
npm run build:github
```

## Troubleshooting

### Build Failures
- Ensure Node.js 18+ is installed
- Check that all dependencies are properly installed
- Verify TypeScript compilation passes: `npm run type-check`

### Deployment Issues
- Confirm GitHub Pages is enabled in repository settings
- Check GitHub Actions logs for detailed error messages
- Ensure the repository is public

### Runtime Errors
- Check browser console for JavaScript errors
- Verify all assets are loading with correct base path
- Test locally with `npm run preview` after building

## Support
For issues or questions:
1. Check the GitHub Actions logs
2. Review browser console errors
3. Verify all configuration files are correctly set up
4. Test the build process locally before deploying

---

**Ready to deploy!** 🚀

Your Wight & Company perforated panel design application will be live at:
**https://y1jeong.github.io/**