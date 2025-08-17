declare global {
  interface Window {
    electronAPI?: {
      getPrinters: () => Promise<Array<{
        name: string;
        description?: string;
        status?: number;
        isDefault?: boolean;
      }>>;
    };
  }
}

export {};
