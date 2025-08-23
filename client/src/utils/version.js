// App version utility
export const APP_VERSION = globalThis.__APP_VERSION__ || '0.1.0';
// Alternative approach using package.json import (if the above doesn't work)
// This requires vite-plugin-pkg to be installed
export const getAppVersion = () => {
    try {
        return APP_VERSION;
    }
    catch (error) {
        console.warn('Could not read app version:', error);
        return '0.1.0';
    }
};
