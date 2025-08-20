import { jsx as _jsx } from "react/jsx-runtime";
import { Button } from '@mui/material';
export const Catch = ({ disabled, onCatch, onFail }) => {
    const round = (n) => {
        // Hardcoded to 3 decimal places as requested
        const m = Math.pow(10, 3);
        return Math.round((Number.isFinite(n) ? n : 0) * m) / m;
    };
    const performCatch = async () => {
        try {
            // Try Electron captureWeight API first if available
            // Prefer using the typed helpers exposed in preload
            // @ts-ignore
            if (window.electron?.ipcRenderer) {
                try {
                    // Try the modern channel first (capture-weight)
                    // @ts-ignore
                    const res = await window.electron.ipcRenderer.invoke('capture-weight');
                    const n = Number(res);
                    if (Number.isFinite(n)) {
                        onCatch(round(n));
                        return;
                    }
                }
                catch (err) {
                    console.warn('capture-weight failed, trying read-weight fallback:', err);
                }
            }
            // Older integration removed: do not attempt 'read-weight' fallback that opens a manual prompt in main process
        }
        catch (e) {
            console.warn('Electron weight read path errored:', e);
        }
        // final fallback: notify parent that scale isn't connected instead of prompting
        if (typeof onFail === 'function')
            onFail();
    };
    return (_jsx(Button, { size: "small", variant: "outlined", onClick: performCatch, disabled: disabled, children: "Catch" }));
};
export default Catch;
