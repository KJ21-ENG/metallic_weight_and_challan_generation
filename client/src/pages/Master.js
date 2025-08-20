import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { api, getOptions } from '../api';
import { Box, Button, Card, CardContent, FormControl, Grid, InputLabel, MenuItem, Select, Stack, Tab, Tabs, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Paper, Typography, Radio, RadioGroup, FormControlLabel } from '@mui/material';
import { ConfirmDialog } from '../components/ConfirmDialog';
const masterTabs = [
    { key: 'metallics', label: 'Metallic' },
    { key: 'cuts', label: 'Cut' },
    { key: 'employees', label: 'Employees' },
    { key: 'bob_types', label: 'Bob Type' },
    { key: 'box_types', label: 'Box Type' },
    { key: 'customers', label: 'Customers' },
    { key: 'shifts', label: 'Shifts' },
    { key: 'firms', label: 'Firm' },
    { key: 'printer_settings', label: 'Printer Settings' },
];
export function MasterPage() {
    const [type, setType] = useState('metallics');
    const [items, setItems] = useState([]);
    const [name, setName] = useState('');
    const [weight, setWeight] = useState('');
    const [role, setRole] = useState('');
    const [address, setAddress] = useState('');
    const [gstin, setGstin] = useState('');
    const [mobile, setMobile] = useState('');
    const [email, setEmail] = useState('');
    const [editingId, setEditingId] = useState(null);
    const [edit, setEdit] = useState(null);
    // Confirmation dialog state
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);
    // Printer settings state
    const [labelPrinter, setLabelPrinter] = useState('');
    const [challanPrinter, setChallanPrinter] = useState('');
    const [availablePrinters, setAvailablePrinters] = useState([]);
    const isWeighted = type === 'bob_types' || type === 'box_types';
    const isEmployees = type === 'employees';
    const isCustomers = type === 'customers';
    const isFirms = type === 'firms';
    const isPrinterSettings = type === 'printer_settings';
    useEffect(() => { load(); resetForm(); }, [type]);
    function resetForm() {
        setName('');
        setWeight('');
        setRole('');
        setAddress('');
        setGstin('');
        setMobile('');
        setEmail('');
        setEditingId(null);
        setEdit(null);
    }
    async function load() {
        if (isPrinterSettings) {
            loadPrinterSettings();
        }
        else {
            let data = await getOptions(type);
            // Ensure numeric fields are numbers so UI (toFixed) works immediately
            if (isWeighted && Array.isArray(data)) {
                data = data.map((d) => ({ ...d, weight_kg: d.weight_kg != null ? Number(d.weight_kg) : d.weight_kg }));
            }
            setItems(data);
        }
    }
    function loadPrinterSettings() {
        console.log('Loading printer settings...');
        console.log('window.electronAPI available:', !!window.electronAPI);
        console.log('window.electronAPI.getPrinters available:', !!(window.electronAPI && window.electronAPI.getPrinters));
        // Get actual available printers using Electron API
        if (window.electronAPI && window.electronAPI.getPrinters) {
            console.log('Calling getPrinters...');
            window.electronAPI.getPrinters().then((printers) => {
                console.log('Received printers:', printers);
                const printerNames = printers.map(p => p.name);
                console.log('Printer names:', printerNames);
                setAvailablePrinters(printerNames);
            }).catch((err) => {
                console.error('Failed to get printers:', err);
                // Fallback to empty list if printer detection fails
                setAvailablePrinters([]);
            });
        }
        else {
            console.log('Electron API not available, falling back to empty list');
            // Fallback for non-Electron environment
            setAvailablePrinters([]);
        }
        // Load saved preferences from localStorage
        const savedLabelPrinter = localStorage.getItem('labelPrinter') || '';
        const savedChallanPrinter = localStorage.getItem('challanPrinter') || '';
        setLabelPrinter(savedLabelPrinter);
        setChallanPrinter(savedChallanPrinter);
    }
    function savePrinterSettings() {
        localStorage.setItem('labelPrinter', labelPrinter);
        localStorage.setItem('challanPrinter', challanPrinter);
        alert('Printer settings saved successfully!');
    }
    async function add() {
        if (!name.trim())
            return;
        const body = { name: name.trim() };
        if (isWeighted)
            body.weight_kg = Number(weight || 0);
        if (isEmployees) {
            body.role_operator = role === 'operator';
            body.role_helper = role === 'helper';
        }
        if (isCustomers) {
            body.address = address || null;
            body.gstin = gstin || null;
        }
        if (isFirms) {
            if (address)
                body.address = address;
            if (gstin)
                body.gstin = gstin;
            if (mobile)
                body.mobile = mobile;
            if (email)
                body.email = email;
        }
        const res = await api.post(`/master/${type}`, body);
        // Coerce numeric fields returned from the API so UI renderers (e.g. toFixed) work immediately
        const newItem = res.data;
        if (isWeighted && newItem && newItem.weight_kg != null)
            newItem.weight_kg = Number(newItem.weight_kg);
        resetForm();
        setItems([...items, newItem]);
    }
    async function startEdit(i) {
        setEditingId(i.id);
        // provide a convenient `role` field for the edit object
        setEdit({ ...i, role: i.role_operator ? 'operator' : (i.role_helper ? 'helper' : '') });
    }
    async function saveEdit(i) {
        if (!edit)
            return;
        const body = {};
        if (isWeighted) {
            body.name = edit.name;
            body.weight_kg = Number(edit.weight_kg || 0);
        }
        else if (isEmployees) {
            body.name = edit.name;
            const r = edit.role;
            body.role_operator = r === 'operator';
            body.role_helper = r === 'helper';
        }
        else if (isCustomers) {
            body.name = edit.name;
            body.address = edit.address || null;
            body.gstin = edit.gstin || null;
        }
        else if (isFirms) {
            body.name = edit.name;
            if (edit.address)
                body.address = edit.address;
            if (edit.gstin)
                body.gstin = edit.gstin;
            if (edit.mobile)
                body.mobile = edit.mobile;
            if (edit.email)
                body.email = edit.email;
        }
        else {
            body.name = edit.name;
        }
        const res = await api.put(`/master/${type}/${i.id}`, body);
        const updated = res.data;
        if (isWeighted && updated && updated.weight_kg != null)
            updated.weight_kg = Number(updated.weight_kg);
        setItems(items.map(it => it.id === i.id ? updated : it));
        setEditingId(null);
        setEdit(null);
    }
    async function remove(id) {
        setItemToDelete(id);
        setDeleteDialogOpen(true);
    }
    async function confirmDelete(reason) {
        if (!itemToDelete)
            return;
        try {
            await api.delete(`/master/${type}/${itemToDelete}`, { params: { reason: reason || '' } });
            setItems(items.filter(i => i.id !== itemToDelete));
            setDeleteDialogOpen(false);
            setItemToDelete(null);
        }
        catch (error) {
            console.error('Failed to delete item:', error);
            setDeleteDialogOpen(false);
            setItemToDelete(null);
        }
    }
    return (_jsxs(Stack, { spacing: 2, children: [_jsx(Tabs, { value: type, onChange: (_, v) => setType(v), children: masterTabs.map(t => _jsx(Tab, { value: t.key, label: t.label }, t.key)) }), isPrinterSettings && (_jsx(Card, { children: _jsxs(CardContent, { children: [_jsx(Typography, { variant: "h6", gutterBottom: true, children: "Printer Configuration" }), _jsx(Typography, { variant: "body2", color: "text.secondary", sx: { mb: 2 }, children: "Configure your preferred printers for labels and challans. These settings are saved locally on your computer." }), availablePrinters.length === 0 ? (_jsxs(Box, { sx: { p: 2, bgcolor: 'warning.light', borderRadius: 1, mb: 2 }, children: [_jsx(Typography, { variant: "body2", color: "warning.dark", children: "No printers detected. Please ensure your system has printers installed and accessible." }), _jsx(Button, { variant: "outlined", size: "small", onClick: loadPrinterSettings, sx: { mt: 1 }, children: "Refresh Printers" })] })) : (_jsxs(Typography, { variant: "body2", color: "success.main", sx: { mb: 2 }, children: [availablePrinters.length, " printer(s) detected"] })), _jsxs(Grid, { container: true, spacing: 3, children: [_jsx(Grid, { item: true, xs: 12, sm: 6, children: _jsxs(FormControl, { fullWidth: true, children: [_jsx(InputLabel, { children: "Label Printer" }), _jsxs(Select, { label: "Label Printer", value: labelPrinter, onChange: (e) => setLabelPrinter(e.target.value), disabled: availablePrinters.length === 0, children: [_jsx(MenuItem, { value: "", children: _jsx("em", { children: "Select Label Printer" }) }), availablePrinters.map((printer) => (_jsx(MenuItem, { value: printer, children: printer }, printer)))] })] }) }), _jsx(Grid, { item: true, xs: 12, sm: 6, children: _jsxs(FormControl, { fullWidth: true, children: [_jsx(InputLabel, { children: "Challan Printer" }), _jsxs(Select, { label: "Challan Printer", value: challanPrinter, onChange: (e) => setChallanPrinter(e.target.value), disabled: availablePrinters.length === 0, children: [_jsx(MenuItem, { value: "", children: _jsx("em", { children: "Select Challan Printer" }) }), availablePrinters.map((printer) => (_jsx(MenuItem, { value: printer, children: printer }, printer)))] })] }) }), _jsx(Grid, { item: true, xs: 12, children: _jsx(Button, { variant: "contained", onClick: savePrinterSettings, disabled: (!labelPrinter && !challanPrinter) || availablePrinters.length === 0, children: "Save Printer Settings" }) })] })] }) })), !isPrinterSettings && (_jsxs(_Fragment, { children: [_jsx(Card, { children: _jsx(CardContent, { children: _jsxs(Grid, { container: true, spacing: 2, alignItems: "center", children: [_jsx(Grid, { item: true, xs: 12, sm: 3, children: _jsx(TextField, { fullWidth: true, label: "Name", value: name, onChange: e => setName(e.target.value) }) }), isWeighted && _jsx(Grid, { item: true, xs: 12, sm: 2, children: _jsx(TextField, { fullWidth: true, label: "Weight (kg)", type: "number", inputProps: { step: '0.001' }, value: weight, onChange: e => setWeight(e.target.value) }) }), isEmployees && (_jsx(Grid, { item: true, xs: 12, sm: 3, children: _jsx(FormControl, { component: Box, children: _jsxs(RadioGroup, { row: true, value: role, onChange: (_, v) => setRole(v), children: [_jsx(FormControlLabel, { value: "operator", control: _jsx(Radio, {}), label: "Operator" }), _jsx(FormControlLabel, { value: "helper", control: _jsx(Radio, {}), label: "Helper" })] }) }) })), (isCustomers || isFirms) && (_jsxs(_Fragment, { children: [_jsx(Grid, { item: true, xs: 12, sm: 4, children: _jsx(TextField, { fullWidth: true, label: "Address", value: address, onChange: e => setAddress(e.target.value) }) }), _jsx(Grid, { item: true, xs: 12, sm: 2, children: _jsx(TextField, { fullWidth: true, label: "GSTIN", value: gstin, onChange: e => setGstin(e.target.value) }) }), isFirms && _jsxs(_Fragment, { children: [_jsx(Grid, { item: true, xs: 12, sm: 2, children: _jsx(TextField, { fullWidth: true, label: "Mobile", value: mobile, onChange: e => setMobile(e.target.value) }) }), _jsx(Grid, { item: true, xs: 12, sm: 2, children: _jsx(TextField, { fullWidth: true, label: "Email", value: email, onChange: e => setEmail(e.target.value) }) })] })] })), _jsx(Grid, { item: true, xs: 12, sm: 'auto', children: _jsx(Button, { onClick: add, children: "+ New" }) })] }) }) }), _jsx(TableContainer, { component: Paper, children: _jsxs(Table, { size: "small", children: [_jsx(TableHead, { children: _jsxs(TableRow, { children: [_jsx(TableCell, { children: "Name" }), isWeighted && _jsx(TableCell, { align: "right", children: "Weight (kg)" }), isEmployees && _jsx(TableCell, { children: "Role" }), isCustomers && _jsxs(_Fragment, { children: [_jsx(TableCell, { children: "Address" }), _jsx(TableCell, { children: "GSTIN" })] }), isFirms && _jsxs(_Fragment, { children: [_jsx(TableCell, { children: "Address" }), _jsx(TableCell, { children: "GSTIN" }), _jsx(TableCell, { children: "Mobile" }), _jsx(TableCell, { children: "Email" })] }), _jsx(TableCell, { align: "right", children: "Actions" })] }) }), _jsx(TableBody, { children: items.map(i => (_jsxs(TableRow, { children: [_jsx(TableCell, { children: editingId === i.id ? (_jsx(TextField, { size: "small", value: edit?.name || '', onChange: e => setEdit({ ...edit, name: e.target.value }) })) : i.name }), isWeighted && (_jsx(TableCell, { align: "right", children: editingId === i.id ? (_jsx(TextField, { size: "small", type: "number", inputProps: { step: '0.001' }, value: edit?.weight_kg ?? 0, onChange: e => setEdit({ ...edit, weight_kg: Number(e.target.value) }) })) : (i.weight_kg?.toFixed?.(3)) })), isEmployees && (_jsx(TableCell, { children: editingId === i.id ? (_jsx(FormControl, { component: Box, children: _jsxs(RadioGroup, { row: true, value: edit?.role || '', onChange: (_, v) => setEdit({ ...edit, role: v }), children: [_jsx(FormControlLabel, { value: "operator", control: _jsx(Radio, {}), label: "Operator" }), _jsx(FormControlLabel, { value: "helper", control: _jsx(Radio, {}), label: "Helper" })] }) })) : (i.role_operator ? 'Operator' : (i.role_helper ? 'Helper' : '')) })), isCustomers && (_jsxs(_Fragment, { children: [_jsx(TableCell, { children: editingId === i.id ? _jsx(TextField, { size: "small", value: edit?.address || '', onChange: e => setEdit({ ...edit, address: e.target.value }) }) : (i.address || '') }), _jsx(TableCell, { children: editingId === i.id ? _jsx(TextField, { size: "small", value: edit?.gstin || '', onChange: e => setEdit({ ...edit, gstin: e.target.value }) }) : (i.gstin || '') })] })), isFirms && (_jsxs(_Fragment, { children: [_jsx(TableCell, { children: editingId === i.id ? _jsx(TextField, { size: "small", value: edit?.address || '', onChange: e => setEdit({ ...edit, address: e.target.value }) }) : (i.address || '') }), _jsx(TableCell, { children: editingId === i.id ? _jsx(TextField, { size: "small", value: edit?.gstin || '', onChange: e => setEdit({ ...edit, gstin: e.target.value }) }) : (i.gstin || '') }), _jsx(TableCell, { children: editingId === i.id ? _jsx(TextField, { size: "small", value: edit?.mobile || '', onChange: e => setEdit({ ...edit, mobile: e.target.value }) }) : (i.mobile || '') }), _jsx(TableCell, { children: editingId === i.id ? _jsx(TextField, { size: "small", value: edit?.email || '', onChange: e => setEdit({ ...edit, email: e.target.value }) }) : (i.email || '') })] })), _jsx(TableCell, { align: "right", children: editingId === i.id ? (_jsxs(Stack, { direction: "row", justifyContent: "flex-end", spacing: 1, children: [_jsx(Button, { size: "small", onClick: () => saveEdit(i), children: "Save" }), _jsx(Button, { size: "small", variant: "outlined", onClick: () => { setEditingId(null); setEdit(null); }, children: "Cancel" })] })) : (_jsxs(Stack, { direction: "row", justifyContent: "flex-end", spacing: 1, children: [_jsx(Button, { size: "small", onClick: () => startEdit(i), children: "Edit" }), _jsx(Button, { size: "small", color: "error", variant: "outlined", onClick: () => remove(i.id), children: "Delete" })] })) })] }, i.id))) })] }) })] })), _jsx(ConfirmDialog, { open: deleteDialogOpen, title: "Confirm Delete", message: `Are you sure you want to delete this ${type.slice(0, -1)}? This action cannot be undone.`, confirmText: "Delete", cancelText: "Cancel", requireReason: true, onConfirm: confirmDelete, onCancel: () => {
                    setDeleteDialogOpen(false);
                    setItemToDelete(null);
                } })] }));
}
