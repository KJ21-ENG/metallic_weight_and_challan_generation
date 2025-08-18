import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Typography } from '@mui/material';
import { useState } from 'react';
export function ConfirmDialog({ open, title, message, confirmText = 'Confirm', cancelText = 'Cancel', requireReason = false, onConfirm, onCancel }) {
    const [reason, setReason] = useState('');
    const handleConfirm = () => {
        onConfirm(requireReason ? reason : undefined);
        setReason('');
    };
    const handleCancel = () => {
        onCancel();
        setReason('');
    };
    return (_jsxs(Dialog, { open: open, onClose: handleCancel, maxWidth: "sm", fullWidth: true, children: [_jsx(DialogTitle, { children: title }), _jsxs(DialogContent, { children: [_jsx(Typography, { sx: { mb: 2 }, children: message }), requireReason && (_jsx(TextField, { fullWidth: true, label: "Reason for delete", value: reason, onChange: (e) => setReason(e.target.value), placeholder: "Enter reason for deletion...", multiline: true, rows: 2 }))] }), _jsxs(DialogActions, { children: [_jsx(Button, { onClick: handleCancel, color: "primary", children: cancelText }), _jsx(Button, { onClick: handleConfirm, color: "error", variant: "contained", disabled: requireReason && !reason.trim(), children: confirmText })] })] }));
}
