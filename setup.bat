@echo off
echo ========================================
echo Wight & Company - Local Setup Script
echo ========================================
echo.

echo Checking Node.js installation...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo Node.js version:
node --version
echo.

echo Installing frontend dependencies...
cd src\frontend
if not exist node_modules (
    echo Running npm install for frontend...
    npm install
    if %errorlevel% neq 0 (
        echo ERROR: Failed to install frontend dependencies
        pause
        exit /b 1
    )
) else (
    echo Frontend dependencies already installed.
)

echo.
echo Installing backend dependencies...
cd ..\backend
if not exist node_modules (
    echo Running npm install for backend...
    npm install
    if %errorlevel% neq 0 (
        echo ERROR: Failed to install backend dependencies
        pause
        exit /b 1
    )
) else (
    echo Backend dependencies already installed.
)

echo.
echo Creating backend environment file...
if not exist .env (
    echo Creating .env file with default settings...
    (
        echo # Server Configuration
        echo PORT=5000
        echo NODE_ENV=development
        echo.
        echo # CORS Settings
        echo CORS_ORIGIN=http://localhost:3001
        echo.
        echo # JWT Secret ^(for user authentication^)
        echo JWT_SECRET=wight-company-local-dev-secret
        echo.
        echo # Database ^(Optional - MongoDB for user accounts^)
        echo # MONGODB_URI=mongodb://localhost:27017/wight-company
    ) > .env
    echo .env file created successfully.
) else (
    echo .env file already exists.
)

cd ..\..

echo.
echo ========================================
echo Setup completed successfully!
echo ========================================
echo.
echo To start the application:
echo 1. Run start-dev.bat (recommended)
echo 2. Or manually start both servers:
echo    - Backend: cd src\backend && npm run dev
echo    - Frontend: cd src\frontend && npm run dev
echo.
echo The application will be available at:
echo - Frontend: http://localhost:3001
echo - Backend API: http://localhost:5000
echo.
pause