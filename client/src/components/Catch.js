import { jsx as _jsx } from "react/jsx-runtime";
import { Button } from '@mui/material';
export const Catch = ({ disabled, onCatch }) => {
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
            // Older integration: try direct read-weight channel
            // @ts-ignore
            if (window.electron?.ipcRenderer) {
                try {
                    // @ts-ignore
                    const res2 = await window.electron.ipcRenderer.invoke('read-weight');
                    const n2 = Number(res2);
                    if (Number.isFinite(n2)) {
                        onCatch(round(n2));
                        return;
                    }
                }
                catch (err) {
                    console.warn('read-weight fallback failed:', err);
                }
            }
        }
        catch (e) {
            console.warn('Electron weight read path errored:', e);
        }
        // final fallback: manual prompt
        const val = window.prompt('Enter weight (kg):');
        if (!val)
            return;
        const num = Number(val);
        if (Number.isFinite(num))
            onCatch(round(num));
    };
    return (_jsx(Button, { size: "small", variant: "outlined", onClick: performCatch, disabled: disabled, children: "Catch" }));
};
export default Catch;
