# Wight & Company - Perforated Panel Generator

A web application for generating customized perforated panels based on user-uploaded halftone pattern images. This tool allows users to create precise perforation patterns for CNC/laser cutting applications.

## Features

- **Image Processing**: Upload halftone images (JPEG, PNG, SVG) and automatically convert them to perforation patterns
- **Customizable Parameters**: Control perforation size, spacing, distribution patterns, and shapes
- **Real-time Preview**: Interactive canvas with zoom, pan, and rotate functionality
- **Multiple Export Formats**: Generate DXF, SVG, PDF, and PNG files for manufacturing
- **Pattern Types**: Support for circles, rectangles, polygons, and custom vector shapes
- **Distribution Patterns**: Grid, staggered, random, and radial arrangements
- **Responsive Design**: Works on desktop, tablet, and mobile devices

## Technology Stack

- **Frontend**: React.js with TypeScript, Vite, Tailwind CSS
- **Backend**: Node.js with Express.js, TypeScript
- **Image Processing**: Canvas API, Sharp
- **File Generation**: Libraries for DXF, SVG, PDF output
- **UI Components**: Radix UI, Lucide React icons

## Prerequisites

Before running this application locally, ensure you have the following installed:

- **Node.js** (version 18.0 or higher)
- **npm** (comes with Node.js) or **yarn**
- **Git** (for cloning the repository)

## Local Installation & Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd RhinoPerforatedWall
```

### 2. Install Frontend Dependencies

```bash
cd src/frontend
npm install
```

### 3. Install Backend Dependencies

```bash
cd ../backend
npm install
```

### 4. Environment Setup

Create environment files for configuration:

#### Backend Environment (.env)
Create a `.env` file in `src/backend/` directory:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database (Optional - MongoDB for user accounts)
MONGODB_URI=mongodb://localhost:27017/wight-company

# JWT Secret (for user authentication)
JWT_SECRET=your-secret-key-here

# CORS Settings
CORS_ORIGIN=http://localhost:3001
```

### 5. Start the Development Servers

#### Option A: Start Both Servers Separately

**Terminal 1 - Backend Server:**
```bash
cd src/backend
npm run dev
```
The backend will start on `http://localhost:5000`

**Terminal 2 - Frontend Server:**
```bash
cd src/frontend
npm run dev
```
The frontend will start on `http://localhost:3001`

#### Option B: Quick Start Script (Windows)
Create a `start-dev.bat` file in the project root:

```batch
@echo off
echo Starting Wight & Company Development Servers...

start "Backend Server" cmd /k "cd src\backend && npm run dev"
timeout /t 3 /nobreak > nul
start "Frontend Server" cmd /k "cd src\frontend && npm run dev"

echo Both servers are starting...
echo Backend: http://localhost:5000
echo Frontend: http://localhost:3001
pause
```

### 6. Access the Application

Once both servers are running:

- **Frontend Application**: http://localhost:3001
- **Backend API**: http://localhost:5000

## Usage Guide

### Basic Workflow

1. **Upload Image**: Navigate to the Design page and upload a halftone image
2. **Adjust Settings**: Configure perforation parameters (size, spacing, pattern type)
3. **Preview**: Use the interactive canvas to preview your design
4. **Export**: Generate files in your preferred format (DXF, SVG, PDF, PNG)

### Key Features

- **Image Upload**: Drag and drop images or click to browse
- **Brightness Threshold**: Adjust the threshold to control perforation density
- **Pattern Inversion**: Invert the pattern for different effects
- **Real-time Statistics**: View total perforations, coverage area, and average size
- **Canvas Tools**: Zoom, pan, and rotate the preview
- **Export Options**: Choose format, scale, units, and precision

## Project Structure

```
RhinoPerforatedWall/
├── src/
│   ├── frontend/          # React.js frontend application
│   │   ├── src/
│   │   │   ├── components/    # Reusable UI components
│   │   │   ├── pages/         # Application pages
│   │   │   ├── utils/         # Utility functions
│   │   │   └── types/         # TypeScript type definitions
│   │   ├── public/            # Static assets
│   │   └── package.json       # Frontend dependencies
│   └── backend/           # Node.js backend API
│       ├── src/
│       │   ├── routes/        # API route handlers
│       │   ├── middleware/    # Express middleware
│       │   ├── utils/         # Backend utilities
│       │   └── types/         # Backend type definitions
│       └── package.json       # Backend dependencies
├── imgs/                  # Project images and assets
├── MEMORY.md             # Development history and notes
└── README.md             # This file
```

## Available Scripts

### Frontend Scripts
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
npm run type-check   # TypeScript type checking
npm run test         # Run tests
```

### Backend Scripts
```bash
npm run dev          # Start development server with hot reload
npm run build        # Compile TypeScript to JavaScript
npm run start        # Start production server
npm run test         # Run tests
npm run lint         # Run ESLint
```

## Troubleshooting

### Common Issues

1. **Port Already in Use**
   - Change the port in the respective package.json or .env file
   - Kill existing processes using the ports

2. **Module Not Found Errors**
   - Ensure all dependencies are installed: `npm install`
   - Clear node_modules and reinstall: `rm -rf node_modules && npm install`

3. **CORS Errors**
   - Verify the CORS_ORIGIN in backend .env matches frontend URL
   - Check that both servers are running

4. **Image Upload Issues**
   - Ensure the backend server is running
   - Check browser console for error messages
   - Verify file format is supported (JPEG, PNG, SVG)

### Development Tips

- Use browser developer tools to debug frontend issues
- Check terminal output for backend error messages
- The application saves design data to browser localStorage
- Hot reload is enabled for both frontend and backend during development

## Production Deployment

For production deployment:

1. **Build the Frontend**:
   ```bash
   cd src/frontend
   npm run build
   ```

2. **Build the Backend**:
   ```bash
   cd src/backend
   npm run build
   ```

3. **Configure Environment Variables** for production
4. **Set up Database** (MongoDB) for user accounts and design storage
5. **Deploy** using your preferred hosting service

## GitHub Pages Deployment

This application can be deployed to GitHub Pages as a static frontend-only version with limited functionality:

### Automatic Deployment

1. **Push to Main Branch**: The GitHub Actions workflow will automatically build and deploy to GitHub Pages when you push to the `main` or `master` branch.

2. **Manual Deployment**: You can also trigger deployment manually from the GitHub Actions tab.

### GitHub Pages Features

- ✅ **Image Upload & Processing**: Full client-side image processing
- ✅ **Perforation Generation**: Complete pattern generation engine
- ✅ **Real-time Preview**: Interactive canvas with all controls
- ✅ **File Export**: SVG, DXF, JSON, and PNG export functionality
- ✅ **Local Storage**: Projects and settings saved in browser
- ❌ **User Authentication**: Not available (static hosting)
- ❌ **Cloud Storage**: Projects stored locally only
- ❌ **Backend API**: All processing done client-side

### Setup GitHub Pages

1. **Enable GitHub Pages** in your repository settings
2. **Set Source** to "GitHub Actions"
3. **Push Changes** to trigger the deployment workflow
4. **Access Your App** at `https://yourusername.github.io/RhinoPerforatedWall/`

### Local Testing of GitHub Pages Build

```bash
# Build for GitHub Pages
cd src/frontend
npm run build

# Preview the build locally
npm run preview
```

The GitHub Pages version automatically switches to static mode and uses local storage for data persistence.

## Contributing

This is a local development project. To contribute:

1. Make your changes in a feature branch
2. Test thoroughly with both frontend and backend
3. Ensure all linting passes
4. Update documentation as needed

## License

This project is for internal use by Wight & Company.

## Support

For technical issues or questions about local setup, refer to the troubleshooting section above or check the development logs in the terminal output.