# Quick Installation Guide

## Prerequisites
- Node.js 16+ installed on your system
- npm (comes with Node.js)
- Access to system printers

## Installation Steps

### 1. Download/Extract
- Download the `local-print-service` folder to your computer
- Extract it to a location of your choice (e.g., `C:\local-print-service` on Windows or `/home/user/local-print-service` on Linux/macOS)

### 2. Install Dependencies
Open a terminal/command prompt in the `local-print-service` folder and run:
```bash
npm install
```

### 3. Start the Service

#### Windows
Double-click `start.bat` or run in command prompt:
```cmd
start.bat
```

#### macOS/Linux
Run in terminal:
```bash
./start.sh
```

#### Manual Start
```bash
npm start
```

### 4. Verify Installation
- Open your web browser
- Go to: `http://localhost:3001/health`
- You should see: `{"status":"ok","timestamp":"..."}`

### 5. Test the Service
- Open `test-client.html` in your browser
- Use it to test printer discovery and printing

## Troubleshooting

### Service Won't Start
- Check if port 3001 is available
- Ensure Node.js is installed: `node --version`
- Check console for error messages

### Print Jobs Fail
- Verify printer names are correct
- Check if printers are online
- Ensure printers support the media sizes

### Permission Issues
- On macOS/Linux, ensure you have printer access
- Try running with elevated privileges if needed

## Next Steps
1. Configure your browser extension to use this service
2. Test with your actual printers
3. Set up auto-start if needed (see README.md for advanced setup)

## Support
- Check the main README.md for detailed documentation
- Review console logs for error details
- Test with the provided test client first
