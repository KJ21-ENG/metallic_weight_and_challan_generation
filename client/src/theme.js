import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { createTheme, ThemeProvider, CssBaseline } from '@mui/material';
const theme = createTheme({
    palette: {
        mode: 'light',
        primary: { main: '#0f766e' },
        secondary: { main: '#7c3aed' },
        background: { default: '#f7f7f9' },
    },
    shape: { borderRadius: 10 },
    components: {
        MuiButton: { defaultProps: { variant: 'contained' } },
        MuiTextField: { defaultProps: { size: 'small' } },
        MuiSelect: { defaultProps: { size: 'small' } },
    },
});
export function AppTheme({ children }) {
    return (_jsxs(ThemeProvider, { theme: theme, children: [_jsx(CssBaseline, {}), children] }));
}
