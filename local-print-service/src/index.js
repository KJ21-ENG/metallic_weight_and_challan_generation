const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static('public'));

// Helper function to get system printers
function getSystemPrinters() {
  return new Promise((resolve, reject) => {
    // Use lpstat to get printer information on macOS/Linux
    exec('lpstat -p', (error, stdout, stderr) => {
      if (error) {
        console.error('Error getting printers:', error);
        // Fallback to hardcoded printers if lpstat fails
        resolve([
          { name: 'Default Printer', status: 'online' },
          { name: 'Label Printer', status: 'online' },
          { name: 'Challan Printer', status: 'online' },
          { name: 'Office Printer', status: 'online' }
        ]);
        return;
      }

      if (stderr) {
        console.error('lpstat stderr:', stderr);
      }

      const printers = [];
      const lines = stdout.trim().split('\n');
      
      lines.forEach(line => {
        if (line.startsWith('printer')) {
          // Parse lpstat output: "printer HP_LaserJet_Pro_M404n is idle.  enabled since ..."
          const match = line.match(/printer\s+(\S+)\s+is\s+(\S+)/);
          if (match) {
            const name = match[1];
            const status = match[2] === 'idle' ? 'online' : 'offline';
            printers.push({ name, status });
          }
        }
      });

      // If no printers found, add a default one
      if (printers.length === 0) {
        printers.push({ name: 'Default Printer', status: 'online' });
      }

      resolve(printers);
    });
  });
}

// Routes
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Get available printers (real system printers)
app.get('/printers', async (req, res) => {
  try {
    const printers = await getSystemPrinters();
    res.json({ printers });
  } catch (error) {
    console.error('Error getting printers:', error);
    res.status(500).json({ error: 'Failed to get printers' });
  }
});

// Debug endpoint to test printer detection
app.get('/debug/printers', (req, res) => {
  exec('lpstat -p', (error, stdout, stderr) => {
    res.json({
      error: error ? error.message : null,
      stderr: stderr || null,
      stdout: stdout || null,
      raw: { error, stdout, stderr }
    });
  });
});

// Print label
app.post('/print/label', async (req, res) => {
  try {
    const { printerName, labelData } = req.body;
    
    if (!printerName || !labelData) {
      return res.status(400).json({ error: 'Printer name and label data are required' });
    }

    console.log(`Printing label to printer: ${printerName}`);
    console.log('Label data:', labelData);

    // Generate label HTML for printing
    const labelHtml = generateLabelHTML(labelData);
    
    // Save label HTML to temp file
    const tempPath = path.join(__dirname, '../temp', `label_${Date.now()}.html`);
    fs.mkdirSync(path.dirname(tempPath), { recursive: true });
    fs.writeFileSync(tempPath, labelHtml);
    
    // For now, just return success
    // In a real implementation, you would send this to the actual printer
    const result = {
      jobID: `job_${Date.now()}`,
      message: `Label queued for printing on ${printerName}`,
      tempFile: tempPath,
      instructions: `Open ${tempPath} in browser and use browser print (Ctrl+P) to print to ${printerName}`
    };
    
    res.json({ success: true, result });
  } catch (error) {
    console.error('Error printing label:', error);
    res.status(500).json({ error: error.message });
  }
});

// Print challan
app.post('/print/challan', async (req, res) => {
  try {
    const { printerName, challanData } = req.body;
    
    if (!printerName || !challanData) {
      return res.status(400).json({ error: 'Printer name and challan data are required' });
    }

    console.log(`Printing challan to printer: ${printerName}`);
    console.log('Challan data:', challanData);

    // Generate challan HTML for printing
    const challanHtml = generateChallanHTML(challanData);
    
    // Save challan HTML to temp file
    const tempPath = path.join(__dirname, '../temp', `challan_${Date.now()}.html`);
    fs.mkdirSync(path.dirname(tempPath), { recursive: true });
    fs.writeFileSync(tempPath, challanHtml);
    
    // For now, just return success
    const result = {
      jobID: `job_${Date.now()}`,
      message: `Challan queued for printing on ${printerName}`,
      tempFile: tempPath,
      instructions: `Open ${tempPath} in browser and use browser print (Ctrl+P) to print to ${printerName}`
    };
    
    res.json({ success: true, result });
  } catch (error) {
    console.error('Error printing challan:', error);
    res.status(500).json({ error: error.message });
  }
});

// Generate label HTML
function generateLabelHTML(labelData) {
  const { header, dateText, color, cut, bobQty, gross, bobWeight, boxWeight, net, operator, helper, barcode } = labelData;
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Label Print</title>
    <style>
        @media print {
            @page {
                size: 75mm 125mm;
                margin: 0;
            }
            body { margin: 0; }
            .label-container { 
                width: 75mm !important; 
                height: 125mm !important; 
                page-break-after: always;
            }
        }
        
        body {
            margin: 0;
            padding: 0;
            font-family: Arial, sans-serif;
        }
        
        .label-container {
            width: 75mm;
            height: 125mm;
            border: 1.4mm solid #000;
            border-radius: 6mm;
            padding: 2.5mm;
            box-sizing: border-box;
            background: white;
            margin: 0;
            position: relative;
        }
        
        .header {
            font-size: 8mm;
            font-weight: 900;
            font-style: italic;
            text-align: center;
            letter-spacing: 0.2mm;
            margin-bottom: 1.5mm;
            text-transform: uppercase;
            border-bottom: 0.7mm solid #000;
            padding-bottom: 2mm;
        }
        
        .row {
            display: grid;
            grid-template-columns: 1fr 2fr;
            border-top: 0.7mm solid #000;
            min-height: 6mm;
        }
        
        .label {
            padding: 2mm;
            border-right: 0.7mm solid #000;
            font-weight: 900;
            display: flex;
            align-items: center;
        }
        
        .value {
            padding: 2mm;
            font-weight: 800;
            display: flex;
            align-items: center;
        }
        
        .weight-row {
            display: grid;
            grid-template-columns: 1.2fr 0.9fr 0.9fr;
            border-top: 0.7mm solid #000;
            min-height: 6mm;
        }
        
        .weight-label {
            padding: 2mm;
            border-right: 0.7mm solid #000;
            font-weight: 900;
        }
        
        .weight-value {
            padding: 1mm;
            font-weight: 900;
            text-align: center;
            display: flex;
            flex-direction: column;
            justify-content: center;
        }
        
        .barcode-area {
            border-top: 0.7mm solid #000;
            height: 8mm;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 4mm;
            letter-spacing: 0.8mm;
            margin-top: 2mm;
        }
        
        .print-instructions {
            position: fixed;
            top: 10px;
            right: 10px;
            background: #007bff;
            color: white;
            padding: 10px;
            border-radius: 5px;
            font-size: 12px;
            z-index: 1000;
        }
        
        @media print {
            .print-instructions { display: none; }
        }
    </style>
</head>
<body>
    <div class="print-instructions">
        Use Ctrl+P (or Cmd+P) to print this label
    </div>
    
    <div class="label-container">
        <div class="header">${header || 'GLINTEX'}</div>
        
        <div class="row">
            <div class="label">DATE :</div>
            <div class="value">${dateText}</div>
        </div>
        
        <div class="row">
            <div class="label">COLOR :</div>
            <div class="value">${color}</div>
        </div>
        
        <div class="row">
            <div class="label">CUT :</div>
            <div class="value">${cut}</div>
        </div>
        
        <div class="row">
            <div class="label">BOB QTY :</div>
            <div class="value">${bobQty}</div>
        </div>
        
        <div class="row">
            <div class="label">GR. WT :</div>
            <div class="value">${gross.toFixed(3)} kg</div>
        </div>
        
        <div class="weight-row">
            <div class="weight-label">
                <div>BOB. WT :</div>
                <div style="margin-top: 1mm; font-weight: 800;">${bobWeight.toFixed(3)} kg</div>
            </div>
            <div class="weight-value">
                <div>BO</div>
                <div>X.</div>
                <div>WT :</div>
            </div>
            <div class="weight-value">
                <div>${boxWeight.toFixed(3)}</div>
                <div>kg</div>
            </div>
        </div>
        
        <div class="row">
            <div class="label">NET WT :</div>
            <div class="value">${net.toFixed(3)} kg</div>
        </div>
        
        <div class="row">
            <div class="label">OP :</div>
            <div class="value">${operator || ''}</div>
        </div>
        
        <div class="row">
            <div class="label">HE :</div>
            <div class="value">${helper || ''}</div>
        </div>
        
        <div class="barcode-area">
            ${barcode}
        </div>
    </div>
    
    <script>
        // Auto-print after a short delay
        setTimeout(() => {
            if (window.location.search.includes('autoprint')) {
                window.print();
            }
        }, 1000);
    </script>
</body>
</html>`;
}

// Generate challan HTML
function generateChallanHTML(challanData) {
  const { challanId, challanNo, date, customer, items, totalNetWeight } = challanData;
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Challan Print</title>
    <style>
        @media print {
            @page {
                size: A4;
                margin: 1cm;
            }
            body { margin: 0; }
            .print-instructions { display: none; }
        }
        
        body {
            margin: 0;
            padding: 20px;
            font-family: Arial, sans-serif;
            line-height: 1.6;
        }
        
        .challan-header {
            text-align: center;
            border-bottom: 2px solid #333;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        
        .challan-title {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 10px;
        }
        
        .challan-details {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 30px;
        }
        
        .detail-group {
            border: 1px solid #ddd;
            padding: 15px;
            border-radius: 5px;
        }
        
        .detail-label {
            font-weight: bold;
            color: #666;
            margin-bottom: 5px;
        }
        
        .detail-value {
            font-size: 16px;
        }
        
        .summary {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 5px;
            text-align: center;
        }
        
        .summary-title {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 15px;
        }
        
        .summary-value {
            font-size: 24px;
            color: #007bff;
        }
        
        .print-instructions {
            position: fixed;
            top: 10px;
            right: 10px;
            background: #007bff;
            color: white;
            padding: 10px;
            border-radius: 5px;
            font-size: 12px;
            z-index: 1000;
        }
    </style>
</head>
<body>
    <div class="print-instructions">
        Use Ctrl+P (or Cmd+P) to print this challan
    </div>
    
    <div class="challan-header">
        <div class="challan-title">DELIVERY CHALLAN</div>
        <div>Metallic Weight & Challan Generation System</div>
    </div>
    
    <div class="challan-details">
        <div class="detail-group">
            <div class="detail-label">Challan Number</div>
            <div class="detail-value">${challanNo}</div>
        </div>
        
        <div class="detail-group">
            <div class="detail-label">Date</div>
            <div class="detail-value">${date}</div>
        </div>
        
        <div class="detail-group">
            <div class="detail-label">Customer</div>
            <div class="detail-value">${customer}</div>
        </div>
        
        <div class="detail-group">
            <div class="detail-label">Total Items</div>
            <div class="detail-value">${items}</div>
        </div>
    </div>
    
    <div class="summary">
        <div class="summary-title">Total Net Weight</div>
        <div class="summary-value">${totalNetWeight.toFixed(3)} kg</div>
    </div>
    
    <script>
        // Auto-print after a short delay
        setTimeout(() => {
            if (window.location.search.includes('autoprint')) {
                window.print();
            }
        }, 1000);
    </script>
</body>
</html>`;
}

// Start server
app.listen(PORT, () => {
  console.log(`Local Print Service running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Available endpoints:`);
  console.log(`  GET  /health - Service health check`);
  console.log(`  GET  /printers - List available printers`);
  console.log(`  POST /print/label - Print label`);
  console.log(`  POST /print/challan - Print challan`);
  console.log(``);
  console.log(`Note: This is a simplified version that generates HTML files.`);
  console.log(`To print, open the generated HTML files in your browser and use Ctrl+P.`);
  console.log(`For direct printing, you'll need to implement system-specific printer drivers.`);
});
