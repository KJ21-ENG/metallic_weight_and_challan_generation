# Printer Settings Feature

## Overview
The Printer Settings feature allows users to configure their preferred printers for labels and challans. Since this is a LAN-based system used on multiple PCs, printer preferences are stored locally on each computer using localStorage.

## Features

### 1. Printer Configuration Tab
- **Location**: Master module → Printer Settings tab
- **Fields**:
  - **Label Printer**: Dropdown to select preferred printer for labels
  - **Challan Printer**: Dropdown to select preferred printer for challans
- **Storage**: Preferences saved to localStorage (local to each PC)
- **Real Printer Detection**: Automatically detects available system printers using Electron API

### 2. Auto-Printing
- **Labels**: When "Add & Print Label" is clicked, labels are automatically sent to the configured label printer
- **Challans**: When "Generate Challan & Print" is clicked, challans are automatically sent to the configured challan printer
- **Fallback**: If no printer is configured, the system falls back to the browser's default print dialog

### 3. User Interface Enhancements
- **Printer Status**: Shows configured printers in the Challan page header
- **Success Alerts**: Displays which printers are configured for each document type
- **Visual Feedback**: Clear indication when printer preferences are active
- **Printer Detection**: Shows count of detected printers and warning if none found
- **Refresh Button**: Allows users to refresh printer detection

## Technical Implementation

### Frontend
- **Printer Settings Tab**: Added to Master page with dropdown selections
- **Printer Utility**: `client/src/utils/printer.ts` manages printer preferences
- **Auto-Print Integration**: Modified Challan page to use preferred printers
- **Local Storage**: Uses browser localStorage for persistence

### Backend
- **No Database Changes**: Printer preferences are client-side only
- **Existing APIs**: Uses existing challan and label generation endpoints

### Electron Integration
- **Preload Script**: `metallic_electron_app/preload.js` exposes printer detection API
- **Real Printer Detection**: Uses `webContents.getPrintersAsync()` to get actual system printers
- **Type Safety**: TypeScript definitions in `client/src/types/electron.d.ts`

## Current Implementation

### Real Printer Detection
- **Electron API**: Uses `webContents.getPrintersAsync()` to detect available printers
- **No Mock Data**: Removed hardcoded printer names, now shows actual system printers
- **Error Handling**: Graceful fallback if printer detection fails
- **User Feedback**: Clear indication of printer detection status

### Browser Constraints
- **Web Print API**: Not yet widely supported across browsers
- **Direct Printing**: Limited to browser print dialog in current implementation
- **Electron Required**: Full printer functionality requires running in Electron app

## Future Enhancements

### 1. Native Integration
- **Electron App**: Convert to desktop app for direct printer access
- **Tauri**: Alternative lightweight desktop framework
- **Browser Extensions**: Custom extension for printer management

### 2. Advanced Features
- **Printer Detection**: Auto-detect available system printers
- **Print Queue**: Manage multiple print jobs
- **Printer Status**: Monitor printer availability and status
- **Network Printers**: Support for network/LAN printers

### 3. Print Server
- **Centralized Management**: Server-side printer configuration
- **User Profiles**: Store printer preferences per user
- **Print History**: Track and manage print jobs

## Usage Instructions

### 1. Configure Printers
1. Go to **Master** → **Printer Settings** tab
2. The system will automatically detect available printers
3. Select your preferred **Label Printer** from the dropdown
4. Select your preferred **Challan Printer** from the dropdown
5. Click **Save Printer Settings**

### 2. Use Auto-Printing
1. **Labels**: Add items to basket → "Add & Print Label" automatically sends to configured printer
2. **Challans**: Generate challan → automatically sends to configured challan printer
3. **Status**: Check the header alerts to confirm printer configuration

### 3. Verify Configuration
- Look for success alerts showing configured printers
- Check printer status in the Challan page header
- Verify localStorage contains your printer preferences

### 4. Troubleshooting
- If no printers are detected, ensure your system has printers installed
- Use the "Refresh Printers" button to retry detection
- Check that you're running the application in Electron (not just browser)

## File Structure

```
client/src/
├── pages/
│   ├── Master.tsx          # Added printer settings tab with real detection
│   └── Challan.tsx         # Modified to use printer preferences
├── utils/
│   └── printer.ts          # Printer utility functions
├── types/
│   └── electron.d.ts       # TypeScript definitions for Electron API

metallic_electron_app/
├── main.js                 # Main Electron process
└── preload.js              # Exposes printer detection API
```

## Recent Changes

### Removed Mock Data
- Eliminated hardcoded printer names (HP LaserJet Pro M404n, Canon PIXMA TS8320, etc.)
- Now detects actual system printers using Electron's native API
- Provides real-time printer availability information

### Enhanced User Experience
- Added printer detection status indicators
- Implemented refresh functionality for printer detection
- Better error handling and user feedback
- Disabled form controls when no printers are available




