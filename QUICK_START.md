# Quick Start Guide - Wight & Company Perforated Panel Generator

## 🚀 Get Started in 3 Steps

### Step 1: Prerequisites
Make sure you have **Node.js 18+** installed:
- Download from: https://nodejs.org/
- Verify installation: Open command prompt and run `node --version`

### Step 2: Setup
Double-click `setup.bat` to automatically install all dependencies.

### Step 3: Run
Double-click `start-dev.bat` to start both servers.

**That's it!** The application will open at http://localhost:3001

---

## 📋 Alternative Setup (Command Line)

If you prefer using the command line:

```bash
# Install dependencies
npm run setup

# Start development servers
npm run dev
```

---

## 🎯 What You Can Do

1. **Upload Images**: Drag and drop halftone images
2. **Customize Patterns**: Adjust size, spacing, and distribution
3. **Preview in Real-time**: Interactive canvas with zoom/pan
4. **Export Files**: Generate DXF, SVG, PDF, or PNG files

---

## 🔧 Troubleshooting

**Port already in use?**
- Close other applications using ports 3001 or 5000
- Or change ports in the configuration files

**Dependencies not installing?**
- Make sure you have a stable internet connection
- Try running `setup.bat` again

**Still having issues?**
- Check the full README.md for detailed troubleshooting
- Look at the terminal output for specific error messages

---

## 📁 Project Structure

```
Wight & Company/
├── setup.bat           # One-click setup
├── start-dev.bat       # One-click start
├── README.md           # Full documentation
├── src/
│   ├── frontend/       # React app (port 3001)
│   └── backend/        # API server (port 5000)
└── imgs/               # Project assets
```

---

**Need help?** Check the detailed README.md file for comprehensive documentation.