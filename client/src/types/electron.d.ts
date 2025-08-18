declare global {
  interface Window {
    electronAPI?: {
      getPrinters: () => Promise<Array<{
        name: string;
        description?: string;
        status?: number;
        isDefault?: boolean;
      }>>;
      printToPrinter: (printerName: string, content: string) => Promise<boolean>;
    };
  }
}

export {};
