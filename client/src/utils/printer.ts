// Printer utility functions for managing printer preferences
import { generateStickerHTML, type StickerData } from './stickerLayout'

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

    // Prepare sticker data for layout generation
    const stickerData: StickerData = {
      header: boxData.firmName || 'FIRM NAME', // Use firmName for header
      dateText: new Date().toLocaleDateString('en-GB'),
      color: selectedLotDetails?.color_name || boxData.color || '',
      cut: boxData.cut || '',
      bobQty: boxData.bobQty || 0,
      gross: parseFloat(boxData.gross) || 0,
      bobWeight: parseFloat(boxData.bobWeight) || 0,
      boxWeight: parseFloat(boxData.boxWeight) || 0,
      net: parseFloat(boxData.net) || 0,
      operator: boxData.operator || '',
      helper: boxData.helper || '',
      barcode: boxData.barcode || '000000000000',
      tare: parseFloat(boxData.tare) || 0,
      boxType: boxData.boxType || '',
      firmName: boxData.firmName || 'FIRM NAME'
    };

    // Generate HTML using the dedicated layout file
    const html = generateStickerHTML(stickerData);

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






