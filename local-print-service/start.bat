@echo off
REM Local Print Service Startup Script for Windows

echo Starting Local Print Service...

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Node.js is not installed. Please install Node.js 16+ first.
    pause
    exit /b 1
)

REM Check if npm is installed
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: npm is not installed. Please install npm first.
    pause
    exit /b 1
)

REM Check if dependencies are installed
if not exist "node_modules" (
    echo Installing dependencies...
    npm install
)

REM Start the service
echo Launching service on port 3001...
echo Health check: http://localhost:3001/health
echo Press Ctrl+C to stop the service
echo.

npm start

pause
