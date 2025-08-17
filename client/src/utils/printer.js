// Printer utility functions for managing printer preferences
import JSPM from 'jsprintmanager';
/**
 * Get saved printer preferences from localStorage
 */
export function getPrinterPreferences() {
    return {
        labelPrinter: localStorage.getItem('labelPrinter') || '',
        challanPrinter: localStorage.getItem('challanPrinter') || ''
    };
}
/**
 * Save printer preferences to localStorage
 */
export function savePrinterPreferences(preferences) {
    localStorage.setItem('labelPrinter', preferences.labelPrinter);
    localStorage.setItem('challanPrinter', preferences.challanPrinter);
}
/**
 * Get the preferred label printer
 */
export function getLabelPrinter() {
    return localStorage.getItem('labelPrinter') || '';
}
/**
 * Get the preferred challan printer
 */
export function getChallanPrinter() {
    return localStorage.getItem('challanPrinter') || '';
}
/**
 * Check if printer preferences are configured
 */
export function hasPrinterPreferences() {
    const prefs = getPrinterPreferences();
    return !!(prefs.labelPrinter || prefs.challanPrinter);
}
/**
 * Initialize JSPrintManager connection
 */
async function initializeJSPrintManager() {
    try {
        JSPM.JSPrintManager.auto_reconnect = true;
        JSPM.JSPrintManager.start();
        // Wait for connection to establish
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('JSPrintManager connection timeout'));
            }, 10000);
            if (JSPM.JSPrintManager.WS) {
                JSPM.JSPrintManager.WS.onStatusChanged = function () {
                    if (JSPM.JSPrintManager.websocket_status === JSPM.WSStatus.Open) {
                        clearTimeout(timeout);
                        resolve();
                    }
                    else if (JSPM.JSPrintManager.websocket_status === JSPM.WSStatus.Closed) {
                        clearTimeout(timeout);
                        reject(new Error('JSPrintManager connection failed'));
                    }
                };
            }
            else {
                // Fallback if WS is not available
                setTimeout(() => {
                    if (JSPM.JSPrintManager.websocket_status === JSPM.WSStatus.Open) {
                        clearTimeout(timeout);
                        resolve();
                    }
                    else {
                        clearTimeout(timeout);
                        reject(new Error('JSPrintManager WS not available'));
                    }
                }, 1000);
            }
        });
    }
    catch (error) {
        throw new Error(`Failed to initialize JSPrintManager: ${error}`);
    }
}
/**
 * Fallback to browser print dialog if JSPrintManager fails
 */
async function fallbackBrowserPrint(content) {
    try {
        console.log('Using fallback browser print...');
        // Create a temporary print window
        const printWindow = window.open('', '_blank', 'width=800,height=600');
        if (!printWindow) {
            throw new Error('Could not open print window');
        }
        const labelHtml = createLabelHTML(content);
        printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Print Label</title>
          <style>
            @media print {
              @page { size: 75mm 125mm; margin: 0; }
              body { margin: 0; padding: 0; background: white; }
              .label-container { width: 75mm !important; height: 125mm !important; }
            }
            body { margin: 0; padding: 0; background: white; }
            .label-container { background: white; }
          </style>
        </head>
        <body>
          ${labelHtml}
        </body>
      </html>
    `);
        printWindow.document.close();
        // Wait for content to load and print
        printWindow.onload = () => {
            printWindow.focus();
            printWindow.print();
            setTimeout(() => printWindow.close(), 1000);
        };
        return true;
    }
    catch (error) {
        console.error('Fallback print failed:', error);
        return false;
    }
}
/**
 * Print to a specific printer using JSPrintManager for direct printing
 * This bypasses the browser print dialog and sends jobs directly to printers
 */
export async function printToPrinter(printerName, content) {
    try {
        console.log(`Attempting direct print to printer: ${printerName}`);
        // Initialize JSPrintManager if not already done
        if (!JSPM.JSPrintManager.websocket_status) {
            await initializeJSPrintManager();
        }
        // Check if JSPrintManager is connected
        if (JSPM.JSPrintManager.websocket_status !== JSPM.WSStatus.Open) {
            throw new Error('JSPrintManager not connected. Please install the client application.');
        }
        // Create print job
        const cpj = new JSPM.ClientPrintJob();
        // Set the target printer
        cpj.clientPrinter = new JSPM.InstalledPrinter(printerName);
        // Create label content as HTML
        const labelHtml = createLabelHTML(content);
        // Convert HTML to print file - using correct API
        const printFile = new JSPM.PrintFile(labelHtml, JSPM.FileSourceType.URL, 'Label.html', 1);
        cpj.files.push(printFile);
        // Send to printer
        await cpj.sendToClient();
        console.log(`Print job sent successfully to ${printerName}`);
        return true;
    }
    catch (error) {
        console.error('Error printing to printer:', error);
        // Fallback to browser print if JSPrintManager fails
        console.log('Falling back to browser print dialog...');
        return await fallbackBrowserPrint(content);
    }
}
/**
 * Create HTML for the label using professional sticker format
 */
function createLabelHTML(labelData) {
    const { header, dateText, color, cut, bobQty, gross, bobWeight, boxWeight, net, operator, helper, barcode } = labelData;
    return `
    <div class="label-container" style="width: 75mm; height: 125mm; border: 1px solid #ddd; border-radius: 2mm; padding: 3mm; box-sizing: border-box; font-family: Arial, sans-serif; background: white; display: flex; flex-direction: column; justify-content: space-between;">
      
      <!-- Header -->
      <div style="font-weight: bold; font-size: 12px; text-align: center; border-bottom: 1px solid #000; padding-bottom: 2px; margin-bottom: 3px; text-transform: uppercase; color: #333;">
        ${header}
      </div>
      
      <!-- Details Section -->
      <div style="flex: 1; display: flex; flex-direction: column; justify-content: space-between;">
        
        <!-- Basic Details -->
        <div style="margin-bottom: 3px;">
          <div style="display: flex; justify-content: space-between; font-size: 10px; margin-bottom: 2px; padding: 1px 0;">
            <span style="font-weight: bold; color: #333; min-width: 60px;">DATE:</span>
            <span style="font-weight: 600; color: #000; text-align: right; flex: 1;">${dateText}</span>
          </div>
          
          <div style="display: flex; justify-content: space-between; font-size: 10px; margin-bottom: 2px; padding: 1px 0;">
            <span style="font-weight: bold; color: #333; min-width: 60px;">COLOR:</span>
            <span style="font-weight: 600; color: #000; text-align: right; flex: 1;">${color}</span>
          </div>
          
          <div style="display: flex; justify-content: space-between; font-size: 10px; margin-bottom: 2px; padding: 1px 0;">
            <span style="font-weight: bold; color: #333; min-width: 60px;">CUT:</span>
            <span style="font-weight: 600; color: #000; text-align: right; flex: 1;">${cut}</span>
          </div>
          
          <div style="display: flex; justify-content: space-between; font-size: 10px; margin-bottom: 2px; padding: 1px 0;">
            <span style="font-weight: bold; color: #333; min-width: 60px;">BOB QTY:</span>
            <span style="font-weight: 600; color: #000; text-align: right; flex: 1;">${bobQty}</span>
          </div>
          
          <div style="display: flex; justify-content: space-between; font-size: 10px; margin-bottom: 2px; padding: 1px 0;">
            <span style="font-weight: bold; color: #333; min-width: 60px;">GR. WT:</span>
            <span style="font-weight: 600; color: #000; text-align: right; flex: 1;">${gross.toFixed(3)} kg</span>
          </div>
        </div>
        
        <!-- Weight Section -->
        <div style="border-top: 1px solid #ccc; margin-top: 3px; padding-top: 3px;">
          <div style="display: flex; justify-content: space-between; font-size: 10px; margin-bottom: 2px; padding: 1px 0;">
            <span style="font-weight: bold; color: #333; min-width: 60px;">BOB. WT:</span>
            <span style="font-weight: 600; color: #000; text-align: right; flex: 1;">${bobWeight.toFixed(3)} kg</span>
          </div>
          
          <div style="display: flex; justify-content: space-between; font-size: 10px; margin-bottom: 2px; padding: 1px 0;">
            <span style="font-weight: bold; color: #333; min-width: 60px;">BOX. WT:</span>
            <span style="font-weight: 600; color: #000; text-align: right; flex: 1;">${boxWeight.toFixed(3)} kg</span>
          </div>
          
          <div style="display: flex; justify-content: space-between; font-size: 10px; margin-bottom: 2px; padding: 1px 0;">
            <span style="font-weight: bold; color: #333; min-width: 60px;">NET WT:</span>
            <span style="font-weight: 600; color: #000; text-align: right; flex: 1;">${net.toFixed(3)} kg</span>
          </div>
        </div>
        
        <!-- Personnel Section -->
        <div style="margin-top: 3px;">
          <div style="display: flex; justify-content: space-between; font-size: 10px; margin-bottom: 2px; padding: 1px 0;">
            <span style="font-weight: bold; color: #333; min-width: 60px;">OP:</span>
            <span style="font-weight: 600; color: #000; text-align: right; flex: 1;">${operator || ''}</span>
          </div>
          
          <div style="display: flex; justify-content: space-between; font-size: 10px; margin-bottom: 2px; padding: 1px 0;">
            <span style="font-weight: bold; color: #333; min-width: 60px;">HE:</span>
            <span style="font-weight: 600; color: #000; text-align: right; flex: 1;">${helper || ''}</span>
          </div>
        </div>
      </div>
      
      <!-- Barcode Section -->
      <div style="text-align: center; margin-top: auto; padding: 2px 0;">
        <svg style="width: 100%; height: 8mm;">
          <rect x="0" y="0" width="100%" height="100%" fill="white"/>
          ${generateBarcodeSVG(barcode)}
        </svg>
        <div style="font-size: 8px; text-align: center; color: #000; margin-top: 1px;">${barcode}</div>
      </div>
      
      <!-- Print Date -->
      <div style="font-size: 8px; text-align: center; color: #666; margin-top: 2px; border-top: 1px solid #eee; padding-top: 2px;">
        Printed: ${new Date().toLocaleString()}
      </div>
    </div>
  `;
}
/**
 * Generate SVG barcode for Code128 format
 * This is a simplified barcode generator for printing
 */
function generateBarcodeSVG(barcode) {
    // Simple barcode pattern - in production you'd use a proper barcode library
    const bars = barcode.split('').map(char => {
        const code = char.charCodeAt(0);
        return code % 2 === 0 ? '1' : '0';
    }).join('');
    let svg = '';
    let x = 0;
    const barWidth = 1;
    const height = 32;
    for (let i = 0; i < bars.length; i++) {
        if (bars[i] === '1') {
            svg += `<rect x="${x}" y="0" width="${barWidth}" height="${height}" fill="black"/>`;
        }
        x += barWidth;
    }
    return svg;
}
