# Metallic Challan Print Extension

A browser extension that bypasses browser printing limitations by sending print jobs directly to a local print service. This extension integrates with the Metallic Challan System to provide seamless label and challan printing.

## 🚀 Features

- **Direct Printer Access** - Bypasses browser printing limitations
- **Printer Selection** - Choose different printers for labels and challans
- **Automatic Detection** - Discovers available printers from local service
- **Print Job Management** - Tracks print jobs and provides status feedback
- **User Preferences** - Remembers printer selections
- **Real-time Notifications** - Shows print job status and errors
- **Service Health Monitoring** - Indicates connection status

## 🏗️ Architecture

```
[Web App] → [Browser Extension] → [Local Print Service] → [Printer]
```

1. **Web App**: Generates print data (labels/challans)
2. **Extension**: Intercepts print requests and manages printer selection
3. **Local Service**: Handles direct printer communication
4. **Printer**: Receives and prints the job

## 📁 File Structure

```
browser-extension/
├── manifest.json          # Extension configuration
├── background.js          # Service worker (background script)
├── content.js            # Content script (injects into web pages)
├── content.css           # Content script styles
├── popup.html            # Extension popup UI
├── popup.js              # Popup functionality
├── icons/                # Extension icons
│   └── README.md         # Icon requirements
└── README.md             # This file
```

## 🔧 Installation

### Prerequisites

1. **Local Print Service** - Must be running on `http://localhost:3001`
2. **Chrome/Edge Browser** - Supports Manifest V3 extensions
3. **Metallic Challan System** - The web application to integrate with

### Installation Steps

#### Method 1: Developer Mode (Recommended for Development)

1. **Download/Extract** the extension folder to your computer
2. **Open Chrome/Edge** and go to `chrome://extensions/`
3. **Enable Developer Mode** (toggle in top-right corner)
4. **Click "Load unpacked"** and select the extension folder
5. **Verify Installation** - Extension should appear in your extensions list

#### Method 2: Packaged Extension

1. **Package the Extension**:
   ```bash
   # In the extension directory
   zip -r metallic-print-extension.zip . -x "*.git*" "*.DS_Store*"
   ```
2. **Install the .zip file** in Chrome/Edge extensions page

### Post-Installation

1. **Start Local Print Service** (if not already running)
2. **Click Extension Icon** in toolbar to open popup
3. **Check Service Status** - Should show "Connected"
4. **Select Printers** - Choose your label and challan printers
5. **Test Connection** - Use the "Test Connection" button

## 🎯 Usage

### Basic Workflow

1. **Navigate** to the Metallic Challan System web app
2. **Select Printers** using the extension popup
3. **Create Labels/Challans** as usual in the web app
4. **Click Print Buttons** - Extension automatically handles printing
5. **Monitor Status** - Check notifications for print job status

### Printer Selection

- **Label Printer**: Used for 75mm×125mm basket labels
- **Challan Printer**: Used for A4 challan documents
- **Preferences**: Automatically saved and restored

### Extension Popup

- **Service Status**: Shows connection to local print service
- **Printer Selection**: Dropdown menus for label and challan printers
- **Quick Actions**: Refresh printers, test connection, show print UI
- **Usage Guide**: Step-by-step instructions

## 🔌 Integration with Web App

### Automatic Integration

The extension automatically detects and integrates with the Metallic Challan System. It:

- **Injects UI** into compatible pages
- **Intercepts Print Requests** from buttons and functions
- **Shows Notifications** for print job status
- **Manages Printer Selection** without modifying the web app

### Manual Integration (Optional)

If you want to trigger printing programmatically:

```javascript
// Trigger label printing
window.triggerLabelPrint({
  header: 'GLINTEX',
  dateText: new Date().toLocaleString(),
  color: 'Red',
  cut: 'Standard',
  bobQty: 5,
  gross: 2.500,
  bobWeight: 0.250,
  boxWeight: 0.100,
  net: 2.150,
  operator: 'John Doe',
  helper: 'Jane Smith',
  barcode: 'CH-25-000001-01'
});

// Trigger challan printing
window.triggerChallanPrint({
  challanId: 123,
  challanNo: 1,
  date: '2025-01-15',
  customer: 'ABC Company',
  items: 5,
  totalNetWeight: 10.750
});
```

## 🛠️ Configuration

### Extension Settings

- **Service URL**: Defaults to `http://localhost:3001`
- **Auto-connect**: Automatically check service health
- **Printer Preferences**: Saved locally in browser storage

### Local Print Service

- **Port**: 3001 (configurable)
- **Host**: localhost only (security)
- **Protocol**: HTTP (no encryption needed for local)

## 🔍 Troubleshooting

### Common Issues

#### Extension Not Working

1. **Check Local Service**: Ensure it's running on port 3001
2. **Verify Permissions**: Check extension permissions in browser
3. **Check Console**: Look for errors in browser developer tools
4. **Restart Extension**: Disable and re-enable the extension

#### Print Jobs Failing

1. **Verify Printer Names**: Check printer names in extension popup
2. **Check Service Logs**: Look at local service console output
3. **Test Connection**: Use "Test Connection" button in popup
4. **Verify Printer Status**: Ensure printers are online and accessible

#### UI Not Showing

1. **Check Page Compatibility**: Extension works on localhost/metallic-challan pages
2. **Refresh Page**: Reload the web page after installing extension
3. **Check Console**: Look for extension initialization errors
4. **Verify Content Script**: Check if content.js is loaded

### Debug Mode

Enable debug logging in the browser console:

1. **Open Developer Tools** (F12)
2. **Go to Console Tab**
3. **Look for Extension Logs** - All extension activities are logged
4. **Check Network Tab** - Monitor communication with local service

## 🔒 Security

### Local Only

- **Network Access**: Only localhost connections allowed
- **No External Calls**: Extension cannot access external services
- **Data Privacy**: Print data stays on local machine

### Permissions

- **activeTab**: Access to current tab only
- **storage**: Save printer preferences locally
- **scripting**: Inject content scripts into web pages

## 🚀 Development

### Building from Source

1. **Clone/Download** the extension source code
2. **Modify Files** as needed
3. **Test Changes** by reloading the extension
4. **Package** when ready for distribution

### Customization

- **UI Styling**: Modify `content.css` and popup styles
- **Functionality**: Extend `content.js` and `background.js`
- **Integration**: Modify how print requests are intercepted
- **Print Types**: Add support for new document types

### Testing

1. **Load Extension** in developer mode
2. **Navigate** to test pages
3. **Test Print Functions** with various data
4. **Check Console** for errors and logs
5. **Verify Print Jobs** are sent to local service

## 📋 Requirements

### Browser Support

- **Chrome**: 88+ (Manifest V3)
- **Edge**: 88+ (Manifest V3)
- **Firefox**: Not supported (Manifest V2 only)

### System Requirements

- **Local Print Service**: Running on localhost:3001
- **Network Access**: Local network only
- **Printer Access**: System printers accessible

## 📞 Support

### Getting Help

1. **Check This README** for common solutions
2. **Review Console Logs** for error details
3. **Test Local Service** independently
4. **Verify Printer Configuration**

### Reporting Issues

When reporting issues, include:

- **Browser Version**: Chrome/Edge version
- **Extension Version**: Current extension version
- **Error Messages**: Console errors and logs
- **Steps to Reproduce**: Detailed reproduction steps
- **System Information**: OS, printer types, etc.

## 📄 License

This extension is provided as-is for the Metallic Challan System. Use at your own risk.

## 🔄 Updates

### Version History

- **v1.0.0**: Initial release with basic printing functionality

### Future Enhancements

- **Print Preview**: Show labels/challans before printing
- **Batch Printing**: Print multiple items at once
- **Print History**: Track and manage print jobs
- **Advanced Settings**: Customize print options
- **Network Printers**: Support for network printer discovery

---

**Note**: This extension requires the Local Print Service to be running on your machine. See the `local-print-service` directory for service setup instructions.
