# System Architecture Overview

## Current System Flow

```
[User clicks "ADD & PRINT LABEL"] 
    ↓
[Web App generates label data]
    ↓
[Browser shows print dialog]
    ↓
[User selects printer]
    ↓
[Browser prints to selected printer]
```

## New System Flow with Local Print Service

```
[User clicks "ADD & PRINT LABEL"]
    ↓
[Web App generates label data]
    ↓
[Browser Extension intercepts data]
    ↓
[Extension shows printer selection]
    ↓
[Extension sends data to Local Print Service]
    ↓
[Local Print Service generates image/PDF]
    ↓
[Local Print Service sends to printer]
    ↓
[Printer prints the job]
```

## Components

### 1. Web Application (Existing)
- **Location**: `client/` folder
- **Role**: Generates label data and challan information
- **Current**: Uses browser print API
- **New**: Sends data to extension (no changes needed to web app)

### 2. Browser Extension (New)
- **Role**: Intercepts print requests and manages printer selection
- **Features**:
  - Printer discovery and selection
  - Data formatting for local service
  - Error handling and user feedback
  - Printer preferences storage

### 3. Local Print Service (New)
- **Location**: `local-print-service/` folder
- **Role**: Direct printer communication
- **Features**:
  - HTTP API for print jobs
  - Printer discovery
  - Image/PDF generation
  - Direct printer access
  - Cross-platform support

### 4. System Printers
- **Access**: Direct via system APIs
- **Support**: Windows, macOS, Linux
- **Media**: Custom sizes (75mm×125mm labels, A4 challans)

## Data Flow

### Label Printing
```javascript
// Web App generates this data
const labelData = {
  header: 'GLINTEX',
  dateText: '2025-01-15 10:30:00',
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
};

// Extension sends to local service
fetch('http://localhost:3001/print/label', {
  method: 'POST',
  body: JSON.stringify({
    printerName: 'Selected_Printer',
    labelData
  })
});
```

### Challan Printing
```javascript
// Web App generates this data
const challanData = {
  challanId: 123,
  challanNo: 1,
  date: '2025-01-15',
  customer: 'ABC Company',
  items: 5,
  totalNetWeight: 10.750
};

// Extension sends to local service
fetch('http://localhost:3001/print/challan', {
  method: 'POST',
  body: JSON.stringify({
    printerName: 'Selected_Printer',
    challanData
  })
});
```

## Benefits of New Architecture

### 1. **Direct Printer Access**
- Bypasses browser printing limitations
- No more print dialog popups
- Direct control over print settings

### 2. **Better User Experience**
- Printer selection in extension
- Consistent printing behavior
- No browser print dialogs

### 3. **Enhanced Features**
- Custom media sizes (75mm×125mm labels)
- High-quality output (300 DPI)
- Print job tracking
- Error handling and feedback

### 4. **Flexibility**
- Works with any printer
- Cross-platform support
- Easy to extend for new print types

### 5. **Reliability**
- No browser dependency
- Consistent print quality
- Better error handling

## Implementation Steps

### Phase 1: Local Print Service
- ✅ Create service structure
- ✅ Implement HTTP API
- ✅ Add printer discovery
- ✅ Basic label printing
- ✅ Basic challan printing

### Phase 2: Browser Extension
- [ ] Create extension manifest
- [ ] Implement content script
- [ ] Add printer selection UI
- [ ] Integrate with local service
- [ ] Handle errors and feedback

### Phase 3: Integration
- [ ] Test with real printers
- [ ] Optimize print quality
- [ ] Add print job tracking
- [ ] User preferences storage

### Phase 4: Production
- [ ] Auto-start service
- [ ] Error monitoring
- [ ] User documentation
- [ ] Deployment scripts

## Security Considerations

### Local Service
- **Network**: Only accepts localhost connections
- **Authentication**: None (local machine only)
- **Input Validation**: All data validated
- **File Access**: Temporary files only, auto-cleaned

### Browser Extension
- **Permissions**: Minimal required permissions
- **Data**: Only sends print data to local service
- **Storage**: Local printer preferences only

### Communication
- **Protocol**: HTTP over localhost
- **Data**: Print job data only
- **Encryption**: Not required (local network)

## Deployment

### Single User
- Download service to local machine
- Run `npm install && npm start`
- Configure extension to use local service

### Multiple Users
- Each user installs service locally
- Service runs on different ports if needed
- Extension configured per user

### Enterprise
- Service packaged as installer
- Auto-start with system
- Centralized configuration
- Monitoring and logging

## Troubleshooting

### Service Issues
- Check if service is running: `http://localhost:3001/health`
- Verify port availability
- Check console logs

### Print Issues
- Verify printer names
- Check printer status
- Test with simple jobs first

### Extension Issues
- Check extension permissions
- Verify local service URL
- Check browser console

## Future Enhancements

### Print Management
- Print job queue
- Job status tracking
- Print history
- Batch printing

### Quality Improvements
- Vector graphics for labels
- Better font handling
- Color management
- Print preview

### Integration
- Multiple printer support
- Network printer discovery
- Print server integration
- Cloud print support
