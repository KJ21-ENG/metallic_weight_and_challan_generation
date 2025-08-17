// Printer utility functions for managing printer preferences
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
 * Print to a specific printer using browser print API
 * Creates a temporary printable element and triggers print
 */
export async function printToPrinter(printerName, content) {
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
    }
    catch (error) {
        console.error('Error printing to printer:', error);
        return false;
    }
}
/**
 * Create HTML for the label that matches the LabelPreview component
 */
function createLabelHTML(labelData) {
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
