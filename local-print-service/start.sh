#!/bin/bash

# Local Print Service Startup Script

echo "Starting Local Print Service..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is not installed. Please install Node.js 16+ first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "Error: npm is not installed. Please install npm first."
    exit 1
fi

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

# Start the service
echo "Launching service on port 3001..."
echo "Health check: http://localhost:3001/health"
echo "Press Ctrl+C to stop the service"
echo ""

npm start
