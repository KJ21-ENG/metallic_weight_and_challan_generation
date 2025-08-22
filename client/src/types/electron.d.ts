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

// Vite environment variables
interface ImportMetaEnv {
  readonly VITE_APP_VERSION: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

export {};
