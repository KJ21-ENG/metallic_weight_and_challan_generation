# Quick Installation Guide

## 🚀 Install the Extension

### Step 1: Download
- Download the `browser-extension` folder to your computer
- Extract it to a location you can easily find

### Step 2: Load in Chrome/Edge
1. Open Chrome or Edge browser
2. Go to `chrome://extensions/` (or `edge://extensions/`)
3. **Enable Developer Mode** (toggle in top-right corner)
4. Click **"Load unpacked"**
5. Select the `browser-extension` folder you downloaded
6. The extension should now appear in your extensions list

### Step 3: Verify Installation
- Look for the extension icon in your browser toolbar
- Click it to open the popup
- You should see "Metallic Print Extension" in the header

## 🔧 Setup the Local Print Service

### Step 1: Start the Service
1. Open terminal/command prompt
2. Navigate to the `local-print-service` folder
3. Run: `npm install` (first time only)
4. Run: `npm start`
5. You should see: "Local Print Service running on port 3001"

### Step 2: Test the Service
- Open browser and go to: `http://localhost:3001/health`
- You should see: `{"status":"ok","timestamp":"..."}`

## 🎯 First Use

### Step 1: Configure Printers
1. Click the extension icon in your toolbar
2. Wait for "Service Status" to show "Connected"
3. Select your **Label Printer** from the dropdown
4. Select your **Challan Printer** from the dropdown
5. Your selections will be saved automatically

### Step 2: Test Printing
1. Go to your Metallic Challan System web app
2. Navigate to the Challan page
3. Fill out a label form
4. Click "ADD & PRINT LABEL"
5. The extension should automatically send the print job

## ❗ Troubleshooting

### Extension Not Working?
- Make sure the local print service is running
- Check that you're on a compatible page (localhost)
- Try refreshing the page after installing the extension

### Print Jobs Failing?
- Verify printer names are correct in the extension popup
- Check that printers are online and accessible
- Look at the local service console for error messages

### Need Help?
- Check the main README.md for detailed documentation
- Look at browser console for error logs
- Ensure both extension and local service are running

## 🎉 You're Ready!

Once both the extension and local service are running, you should have:
- ✅ Direct printing without browser dialogs
- ✅ Printer selection in the extension
- ✅ Automatic print job handling
- ✅ Real-time status notifications

The extension will automatically detect when you're on the Metallic Challan System and handle all printing seamlessly!
