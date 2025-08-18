// Printer utility functions for managing printer preferences

export interface PrinterPreferences {
  labelPrinter: string;
  challanPrinter: string;
}

/**
 * Get saved printer preferences from localStorage
 */
export function getPrinterPreferences(): PrinterPreferences {
  return {
    labelPrinter: localStorage.getItem('labelPrinter') || '',
    challanPrinter: localStorage.getItem('challanPrinter') || ''
  };
}

/**
 * Save printer preferences to localStorage
 */
export function savePrinterPreferences(preferences: PrinterPreferences): void {
  localStorage.setItem('labelPrinter', preferences.labelPrinter);
  localStorage.setItem('challanPrinter', preferences.challanPrinter);
}

/**
 * Get the preferred label printer
 */
export function getLabelPrinter(): string {
  return localStorage.getItem('labelPrinter') || '';
}

/**
 * Get the preferred challan printer
 */
export function getChallanPrinter(): string {
  return localStorage.getItem('challanPrinter') || '';
}

/**
 * Check if printer preferences are configured
 */
export function hasPrinterPreferences(): boolean {
  const prefs = getPrinterPreferences();
  return !!(prefs.labelPrinter || prefs.challanPrinter);
}

/**
 * Print a label automatically when item is added to basket
 * Uses the working Electron IPC approach from receive.js
 */
export async function printLabel(labelData: any): Promise<boolean> {
  try {
    const labelPrinter = getLabelPrinter();
    if (!labelPrinter) {
      console.warn('No label printer configured. Please configure in Master → Printer Settings.');
      return false;
    }

    console.log(`Printing label to: ${labelPrinter}`);
    console.log('Label data:', labelData);

    // Use the working silent printing approach
    const printingCompleted = await silentPrintBoxSticker(labelData, labelData.barcode, labelData.header, {
      customer_name: labelData.color || '',
      color_name: labelData.color || '',
      issues: []
    });

    if (!printingCompleted) {
      console.warn('Label printing failed');
      return false;
    }

    console.log('Label printed successfully');
    return true;
  } catch (error) {
    console.error('Error printing label:', error);
    return false;
  }
}

/**
 * Silent printing with Electron - working approach from receive.js
 */
async function silentPrintBoxSticker(boxData: any, rollId: string, customerName: string, selectedLotDetails: any): Promise<boolean> {
  let loadingOverlay: HTMLElement | null = null;
  
  try {
    // Create and Show Loading Overlay with Progress Bar
    loadingOverlay = document.createElement('div');
    loadingOverlay.id = 'print-loading-overlay';
    loadingOverlay.className = "fixed inset-0 w-full h-full bg-black/50 flex justify-center items-center z-[10000] font-['Arial',_sans-serif]";
    loadingOverlay.innerHTML = `
      <div class="bg-white p-[30px_40px] rounded-lg text-center shadow-[0_4px_15px_rgba(0,0,0,0.2)]">
        <div class="loading-message text-gray-800 mb-5 text-lg font-bold">Printing Sticker...</div>
        <div class="progress-bar-container w-[250px] h-[10px] bg-gray-200 rounded-[5px] overflow-hidden mx-auto">
          <div class="w-full h-full bg-blue-500 rounded-[5px] animate-[indeterminate-progress_2s_linear_infinite]"></div>
        </div>
      </div>
    `;
    document.body.appendChild(loadingOverlay);

    // Get Printer Settings
    const settings = getPrinterPreferences();
    const printerName = settings.labelPrinter || 'Microsoft Print to PDF';
    console.log('Using printer from settings:', printerName);

    // Prepare Print Content with proper typing
    const printContent: {
      customerName: string;
      rollId: string;
      boxType: any;
      grossWeight: string;
      color: string;
      cut: string;
      netWeight: string;
      operator: string;
      helper: string;
      bobbinQty: any;
      barcode: any;
      tareWeight: string;
      printDate: string;
      totalBobbinWeight?: string;
      boxWeight?: string;
    } = {
      customerName: customerName || '',
      rollId: rollId || '',
      boxType: boxData.boxType || '',
      grossWeight: `${boxData.gross || 0}`,
      color: `${selectedLotDetails?.color_name || boxData.color || ''}`,
      cut: `${boxData.cut || ''}`,
      netWeight: `${boxData.net || 0}`,
      operator: `${boxData.operator || ''}`,
      helper: `${boxData.helper || ''}`,
      bobbinQty: boxData.bobQty || 0,
      barcode: boxData.barcode,
      tareWeight: `${boxData.tare || 0}`,
      printDate: new Date().toLocaleDateString('en-GB')
    };

    // Calculate individual weight components
    const bobbinWeightPerItemKg = (parseFloat(boxData.bobWeight) || 0);
    const totalBobbinWeight = (parseInt(boxData.bobQty) || 0) * bobbinWeightPerItemKg;
    const combinedTareWeight = parseFloat(printContent.tareWeight) || 0;
    const boxWeightKg = combinedTareWeight - totalBobbinWeight;

    // Add individual components to printContent
    printContent.totalBobbinWeight = totalBobbinWeight.toFixed(3);
    printContent.boxWeight = boxWeightKg.toFixed(3);

    // Generate HTML
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>SAMAY JARI</title>
    <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
    <style>
        @page {
            size: 75mm 125mm;
            margin: 0;
        }

        body {
            margin: 0;
            padding: 0;
        }

        .sticker-border {
            width: 75mm;
            height: 125mm;
            box-sizing: border-box;
            padding: 10px;
            border: 2px solid black;
            border-radius: 10px;
            background-color: white;
            display: flex;
            justify-content: center;
            align-items: center;
        }

        .sticker-inner {
            width: 100%;
            height: 100%;
            display: flex;
            flex-direction: column;
            border: 2px solid black;
            border-radius: 10px;
            overflow: hidden;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            flex-grow: 1;
        }

        td {
            border: 1px solid black;
            padding: 6px;
            font-size: 11px;
            font-weight: bold;
            color: black;
        }

        .header {
            text-align: center;
            font-size: 18px;
            font-weight: bold;
            font-style: italic;
            font-family: 'Arial Black', sans-serif;
            padding: 8px;
            border-bottom: 2px solid black;
            color: black;
        }

        .barcode-container {
            text-align: center;
            padding: 8px;
            border-top: 2px solid black;
        }

        #barcode {
            max-width: 90%;
            height: auto;
        }
    </style>
</head>
<body>
    <div class="sticker-border">
        <div class="sticker-inner">
            <div class="header">SAMAY JARI</div>
            <table>
                <tr>
                    <td>DATE :</td>
                    <td>${printContent.printDate || ''}</td>
                </tr>
                <tr>
                    <td>COLOR :</td>
                    <td>${printContent.color || ''}</td>
                </tr>
                <tr>
                    <td>CUT :</td>
                    <td>${printContent.cut || ''}</td>
                </tr>
                <tr>
                    <td>BOB QTY :</td>
                    <td>${printContent.bobbinQty || ''}</td>
                </tr>
                <tr>
                    <td>GR. WT :</td>
                    <td>${printContent.grossWeight ? printContent.grossWeight + ' kg' : ''}</td>
                </tr>
                <tr>
                    <td>Box Wt :</td>
                    <td>${printContent.boxWeight ? printContent.boxWeight + ' kg' : ''}</td>
                </tr>
                <tr>
                    <td>Bob Wt :</td>
                    <td>${printContent.totalBobbinWeight ? printContent.totalBobbinWeight + ' kg' : ''}</td>
                </tr>
                <tr>
                    <td>NET WT :</td>
                    <td>${printContent.netWeight ? printContent.netWeight + ' kg' : ''}</td>
                </tr>
                <tr>
                    <td>OP & HE :</td>
                    <td>${(printContent.operator || '') + (printContent.helper ? ' & ' + printContent.helper : '')}</td>
                </tr>
            </table>
            <div class="barcode-container">
                <svg id="barcode"></svg>
            </div>
        </div>
    </div>

    <script>
        window.onload = function () {
            try {
                JsBarcode("#barcode", "${printContent.barcode || '000000000000'}", {
                    format: "CODE128",
                    displayValue: true,
                    fontSize: 12,
                    height: 40,
                    width: 1.5,
                    lineColor: "#000",
                    margin: 5
                });
                console.log("Barcode generated successfully");
            } catch (e) {
                console.error("Error generating barcode:", e);
            }
        }
    </script>
</body>
</html>
    `;

    // Send Print Command via Electron
    if ((window as any).electron) {
      try {
        console.log('Sending print command to Electron...');
        const printResult = await (window as any).electron.ipcRenderer.invoke('print-silently', {
          html: html,
          silent: true,
          printBackground: true,
          deviceName: printerName
        });
        console.log('Print command result:', printResult);
        
        if (printResult === true) {
          console.log('Silent print sent successfully');
          
          // Update loading overlay for success
          if (loadingOverlay) {
            const successMessage = loadingOverlay.querySelector('.loading-message');
            if (successMessage) {
              successMessage.textContent = 'Print Successful!';
              successMessage.classList.remove('text-gray-800', 'text-red-600');
              successMessage.classList.add('text-green-600');
            }
            const progressBarContainer = loadingOverlay.querySelector('.progress-bar-container');
            if (progressBarContainer) progressBarContainer.classList.add('hidden');
          }

          // Remove overlay after a short delay
          setTimeout(() => {
            if (loadingOverlay && loadingOverlay.parentNode) {
              loadingOverlay.parentNode.removeChild(loadingOverlay);
            }
          }, 1500);

          return true;
        } else {
          console.error('Print command returned false or undefined');
          throw new Error('Print command failed - returned false or undefined');
        }
      } catch (printError) {
        console.error('Error in Electron print command:', printError);
        throw printError;
      }
    } else {
      console.warn('Electron not available, cannot print silently.');
      // Update loading overlay for error
      if (loadingOverlay) {
        const errorMessage = loadingOverlay.querySelector('.loading-message');
        if (errorMessage) {
          errorMessage.textContent = 'Error: Electron printing not available.';
          errorMessage.classList.remove('text-gray-800', 'text-green-600');
          errorMessage.classList.add('text-red-600');
        }
        const progressBarContainer = loadingOverlay.querySelector('.progress-bar-container');
        if (progressBarContainer) progressBarContainer.classList.add('hidden');
      }

      // Remove overlay after showing the error
      setTimeout(() => {
        if (loadingOverlay && loadingOverlay.parentNode) {
          loadingOverlay.parentNode.removeChild(loadingOverlay);
        }
      }, 2500);
      return false;
    }
  } catch (error) {
    console.error('Error in silent printing:', error);
    // Update loading overlay for error
    if (loadingOverlay) {
      const errorMessage = loadingOverlay.querySelector('.loading-message');
      if (errorMessage) {
        errorMessage.textContent = 'Error: ' + ((error as Error).message || 'Print Failed');
        errorMessage.classList.remove('text-gray-800', 'text-green-600');
        errorMessage.classList.add('text-red-600');
      }
      const progressBarContainer = loadingOverlay.querySelector('.progress-bar-container');
      if (progressBarContainer) progressBarContainer.classList.add('hidden');

      // Remove overlay after showing the error
      setTimeout(() => {
        if (loadingOverlay && loadingOverlay.parentNode) {
          loadingOverlay.parentNode.removeChild(loadingOverlay);
        }
      }, 2500);
    }
    return false;
  }
}

/**
 * Print to a specific printer using browser print API
 * Creates a temporary printable element and triggers print
 */
export async function printToPrinter(printerName: string, content: any): Promise<boolean> {
  try {
    console.log(`Printing to printer: ${printerName}`);
    console.log('Content to print:', content);
    
    // Create a temporary printable element
    const printElement = document.createElement('div');
    printElement.style.position = 'absolute';
    printElement.style.left = '-9999px';
    printElement.style.top = '-9999px';
    
    // Create the label content using the same structure as LabelPreview
    const labelHtml = createLabelHTML(content);
    printElement.innerHTML = labelHtml;
    
    // Add to DOM temporarily
    document.body.appendChild(printElement);
    
    // Trigger print
    window.print();
    
    // Clean up
    setTimeout(() => {
      document.body.removeChild(printElement);
    }, 1000);
    
    return true;
  } catch (error) {
    console.error('Error printing to printer:', error);
    return false;
  }
}

/**
 * Create HTML for the label that matches the LabelPreview component
 */
function createLabelHTML(labelData: any): string {
  const { header, dateText, color, cut, bobQty, gross, bobWeight, boxWeight, net, operator, helper, barcode } = labelData;
  
  return `
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
    </style>
    <div class="label-container" style="width: 75mm; height: 125mm; border: 1.4mm solid #000; border-radius: 6mm; padding: 2.5mm; box-sizing: border-box; font-family: Arial, Helvetica, sans-serif; background: white; margin: 0;">
      <div style="font-size: 8mm; font-weight: 900; font-style: italic; text-align: center; letter-spacing: 0.2mm; margin-bottom: 1.5mm; text-transform: uppercase;">${header}</div>
      <div style="border: 0.7mm solid #000; border-radius: 3mm; overflow: hidden;">
        <div style="display: grid; grid-template-columns: 1fr 2fr; border-top: 0.7mm solid #000;">
          <div style="padding: 2mm; border-right: 0.7mm solid #000; font-weight: 900;">DATE :</div>
          <div style="padding: 2mm; font-weight: 800;">${dateText}</div>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 2fr; border-top: 0.7mm solid #000;">
          <div style="padding: 2mm; border-right: 0.7mm solid #000; font-weight: 900;">COLOR :</div>
          <div style="padding: 2mm; font-weight: 800;">${color}</div>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 2fr; border-top: 0.7mm solid #000;">
          <div style="padding: 2mm; border-right: 0.7mm solid #000; font-weight: 900;">CUT :</div>
          <div style="padding: 2mm; font-weight: 800;">${cut}</div>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 2fr; border-top: 0.7mm solid #000;">
          <div style="padding: 2mm; border-right: 0.7mm solid #000; font-weight: 900;">BOB QTY :</div>
          <div style="padding: 2mm; font-weight: 800;">${bobQty}</div>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 2fr; border-top: 0.7mm solid #000;">
          <div style="padding: 2mm; border-right: 0.7mm solid #000; font-weight: 900;">GR. WT :</div>
          <div style="padding: 2mm; font-weight: 800;">${gross.toFixed(3)} kg</div>
        </div>
        <div style="display: grid; grid-template-columns: 1.2fr 0.9fr 0.9fr; border-top: 0.7mm solid #000;">
          <div style="padding: 2mm; border-right: 0.7mm solid #000;">
            <div style="font-weight: 900;">BOB. WT :</div>
            <div style="margin-top: 1mm; font-weight: 800;">${bobWeight.toFixed(3)} kg</div>
          </div>
          <div style="padding: 1mm 0; border-right: 0.7mm solid #000; font-weight: 900; text-align: center; line-height: 1.05;">BO<br/>X.<br/>WT :</div>
          <div style="padding: 1mm; font-weight: 900; text-align: center;">${boxWeight.toFixed(3)}<br/>kg</div>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 2fr; border-top: 0.7mm solid #000;">
          <div style="padding: 2mm; border-right: 0.7mm solid #000; font-weight: 900;">NET WT :</div>
          <div style="padding: 2mm; font-weight: 800;">${net.toFixed(3)} kg</div>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 2fr; border-top: 0.7mm solid #000;">
          <div style="padding: 2mm; border-right: 0.7mm solid #000; font-weight: 900;">OP :</div>
          <div style="padding: 2mm; font-weight: 800;">${operator || ''}</div>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 2fr; border-top: 0.7mm solid #000;">
          <div style="padding: 2mm; border-right: 0.7mm solid #000; font-weight: 800;">HE :</div>
          <div style="padding: 2mm; font-weight: 800;">${helper || ''}</div>
        </div>
        <div style="border-top: 0.7mm solid #000; height: 6mm;"></div>
      </div>
      <div style="margin-top: 2mm; text-align: center;">
        <div style="font-size: 4mm; letter-spacing: 0.8mm; margin-top: 1mm;">${barcode}</div>
      </div>
    </div>
  `;
}




