import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Dialog, DialogContent, DialogTitle, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
export function Modal({ open, title, onClose, children, maxWidth = 'md' }) {
    return (_jsxs(Dialog, { open: open, onClose: onClose, fullWidth: true, maxWidth: maxWidth, children: [_jsxs(DialogTitle, { sx: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' }, children: [title, _jsx(IconButton, { onClick: onClose, children: _jsx(CloseIcon, {}) })] }), _jsx(DialogContent, { children: children })] }));
}
