# Local Print Service

A local print service that runs on each PC to handle direct printing for the Metallic Challan System. This service bypasses browser printing limitations by providing direct printer access.

## Architecture

```
[Web App] → [Browser Extension] → [Local Print Service] → [Printer]
```

1. **Web App**: Generates print data
2. **Browser Extension**: Captures data and sends to local service
3. **Local Print Service**: Receives data and prints directly to specified printer
4. **Printer**: Receives and prints the job

## Features

- **Direct Printer Access**: Bypasses browser printing limitations
- **Multiple Printer Support**: Can print to any configured printer
- **Label Printing**: Generates and prints 75mm × 125mm labels
- **Challan Printing**: Generates and prints A4 challan documents
- **Printer Discovery**: Lists all available printers on the system
- **High Quality**: 300 DPI output for crisp printing
- **Cross-Platform**: Works on Windows, macOS, and Linux

## Installation

### Prerequisites

- Node.js 16+ 
- npm or yarn
- Access to system printers

### Setup

1. **Clone/Download** the service to your local machine
2. **Install Dependencies**:
   ```bash
   npm install
   ```
3. **Configure Environment**:
   ```bash
   cp .env.example .env
   # Edit .env with your preferences
   ```
4. **Start the Service**:
   ```bash
   npm start
   # or for development with auto-restart:
   npm run dev
   ```

## Usage

### Starting the Service

```bash
# Production
npm start

# Development (with auto-restart)
npm run dev
```

The service will start on port 3001 by default.

### API Endpoints

#### Health Check
```http
GET http://localhost:3001/health
```

#### List Printers
```http
GET http://localhost:3001/printers
```

#### Print Label
```http
POST http://localhost:3001/print/label
Content-Type: application/json

{
  "printerName": "Your_Printer_Name",
  "labelData": {
    "header": "GLINTEX",
    "dateText": "2025-01-15 10:30:00",
    "color": "Red",
    "cut": "Standard",
    "bobQty": 5,
    "gross": 2.500,
    "bobWeight": 0.250,
    "boxWeight": 0.100,
    "net": 2.150,
    "operator": "John Doe",
    "helper": "Jane Smith",
    "barcode": "CH-25-000001-01"
  }
}
```

#### Print Challan
```http
POST http://localhost:3001/print/challan
Content-Type: application/json

{
  "printerName": "Your_Printer_Name",
  "challanData": {
    "challanId": 123,
    "challanNo": 1,
    "date": "2025-01-15",
    "customer": "ABC Company",
    "items": 5,
    "totalNetWeight": 10.750
  }
}
```

## Integration with Browser Extension

The browser extension should:

1. **Capture Print Data**: Intercept print requests from the web app
2. **Send to Local Service**: POST data to `http://localhost:3001/print/label` or `/print/challan`
3. **Handle Responses**: Show success/error messages to user
4. **Printer Selection**: Allow users to select target printer

### Example Extension Code

```javascript
// In your browser extension
async function printLabel(labelData, printerName) {
  try {
    const response = await fetch('http://localhost:3001/print/label', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        printerName,
        labelData
      })
    });
    
    const result = await response.json();
    
    if (result.success) {
      console.log('Print job sent successfully:', result.result);
    } else {
      console.error('Print failed:', result.error);
    }
  } catch (error) {
    console.error('Failed to send print job:', error);
  }
}
```

## Printer Configuration

### Supported Printers

- **Windows**: All printers accessible via Windows Print Spooler
- **macOS**: All printers accessible via CUPS
- **Linux**: All printers accessible via CUPS

### Media Sizes

- **Labels**: 75mm × 125mm (Custom size)
- **Challans**: A4 (210mm × 297mm)

### Print Quality

- **Labels**: 300 DPI for crisp text and barcodes
- **Challans**: Standard A4 quality

## Troubleshooting

### Common Issues

1. **Service Won't Start**
   - Check if port 3001 is available
   - Ensure Node.js is properly installed
   - Check console for error messages

2. **Print Jobs Fail**
   - Verify printer name is correct
   - Check if printer is online and accessible
   - Ensure printer supports the media size

3. **Permission Errors**
   - Run service with appropriate permissions
   - Check printer access rights
   - On macOS/Linux, ensure CUPS access

4. **CORS Issues**
   - Service includes CORS headers
   - Ensure extension is making requests from allowed origins

### Debug Mode

Enable debug logging by setting environment variable:
```bash
DEBUG=* npm start
```

## Security Considerations

- **Local Only**: Service only accepts connections from localhost
- **No Authentication**: Runs on local machine only
- **Input Validation**: Validates all incoming data
- **File Cleanup**: Temporary files are automatically removed

## Development

### Project Structure

```
local-print-service/
├── src/
│   └── index.js          # Main server file
├── package.json          # Dependencies and scripts
├── .env.example         # Environment configuration
├── README.md            # This file
└── temp/                # Temporary files (auto-created)
```

### Adding New Print Types

1. Create new endpoint in `src/index.js`
2. Implement print function
3. Add to API documentation
4. Update extension integration

### Testing

```bash
# Test health endpoint
curl http://localhost:3001/health

# Test printer listing
curl http://localhost:3001/printers

# Test label printing (replace with actual data)
curl -X POST http://localhost:3001/print/label \
  -H "Content-Type: application/json" \
  -d '{"printerName":"test","labelData":{...}}'
```

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review console logs
3. Verify printer configuration
4. Test with simple print jobs first

## License

MIT License - see package.json for details.
