@echo off
echo ========================================
echo Starting Wight & Company Development Servers
echo ========================================
echo.

echo Checking if dependencies are installed...
if not exist "src\frontend\node_modules" (
    echo ERROR: Frontend dependencies not found!
    echo Please run setup.bat first to install dependencies.
    pause
    exit /b 1
)

if not exist "src\backend\node_modules" (
    echo ERROR: Backend dependencies not found!
    echo Please run setup.bat first to install dependencies.
    pause
    exit /b 1
)

echo Starting Backend Server...
start "Wight & Company - Backend Server" cmd /k "cd /d %~dp0src\backend && echo Backend Server Starting... && npm run dev"

echo Waiting 3 seconds for backend to initialize...
timeout /t 3 /nobreak > nul

echo Starting Frontend Server...
start "Wight & Company - Frontend Server" cmd /k "cd /d %~dp0src\frontend && echo Frontend Server Starting... && npm run dev"

echo.
echo ========================================
echo Both servers are starting!
echo ========================================
echo.
echo Backend Server: http://localhost:5000
echo Frontend Application: http://localhost:3001
echo.
echo Two new command windows will open:
echo 1. Backend Server (Node.js/Express)
echo 2. Frontend Server (React/Vite)
echo.
echo Wait for both servers to fully start, then open:
echo http://localhost:3001
echo.
echo To stop the servers, close both command windows
echo or press Ctrl+C in each window.
echo.
pause