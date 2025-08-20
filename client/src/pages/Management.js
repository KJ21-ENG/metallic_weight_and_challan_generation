import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import { api, getOptions } from '../api';
import { Button, Card, CardContent, Grid, Stack, TextField, Typography, TableContainer, Paper, Table, TableHead, TableRow, TableCell, TableBody, Select, MenuItem, FormControl, InputLabel, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
export function ManagementPage() {
    const [rows, setRows] = useState([]);
    const [from, setFrom] = useState('');
    const [to, setTo] = useState('');
    const [customerId, setCustomerId] = useState('');
    const [challanNo, setChallanNo] = useState('');
    const [editing, setEditing] = useState(null);
    const [items, setItems] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [shifts, setShifts] = useState([]);
    const [metallics, setMetallics] = useState([]);
    const [cuts, setCuts] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [bobTypes, setBobTypes] = useState([]);
    const [boxTypes, setBoxTypes] = useState([]);
    const [deleteRow, setDeleteRow] = useState(null);
    const [deleteReason, setDeleteReason] = useState('');
    useEffect(() => { load(); (async () => { if (customers.length === 0)
        setCustomers(await getOptions('customers')); })(); }, []);
    async function load() {
        const res = await api.get('/challans');
        setRows(res.data);
    }
    async function search() {
        const params = { from, to };
        if (customerId !== '')
            params.customer_id = customerId;
        if (challanNo)
            params.challan_no = Number(challanNo);
        const res = await api.get('/challans', { params });
        setRows(res.data);
    }
    function openPdf(row) {
        if (row.id)
            window.open(`/api/challans/${row.id}/print`, '_blank');
    }
    async function startEdit(row) {
        const res = await api.get(`/challans/${row.id}`);
        const { challan, items } = res.data;
        setEditing({ id: challan.id, challan_no: challan.challan_no, date: challan.date, customer_id: challan.customer_id, shift_id: challan.shift_id });
        setItems(items.map((it) => ({
            metallic_id: it.metallic_id,
            cut_id: it.cut_id,
            operator_id: it.operator_id,
            helper_id: it.helper_id,
            bob_type_id: it.bob_type_id,
            box_type_id: it.box_type_id,
            bob_qty: Number(it.bob_qty),
            gross_wt: Number(it.gross_wt),
        })));
        if (customers.length === 0)
            setCustomers(await getOptions('customers'));
        if (shifts.length === 0)
            setShifts(await getOptions('shifts'));
        if (metallics.length === 0)
            setMetallics(await getOptions('metallics'));
        if (cuts.length === 0)
            setCuts(await getOptions('cuts'));
        if (employees.length === 0)
            setEmployees(await getOptions('employees'));
        if (bobTypes.length === 0)
            setBobTypes(await getOptions('bob_types'));
        if (boxTypes.length === 0)
            setBoxTypes(await getOptions('box_types'));
    }
    function weightOf(opts, id) { return Number(opts.find(o => o.id === id)?.weight_kg ?? 0); }
    function nameOf(opts, id) { return opts.find(o => o.id === id)?.name || ''; }
    function addRow() {
        setItems([...items, { metallic_id: 0, cut_id: 0, operator_id: 0, helper_id: null, bob_type_id: 0, box_type_id: 0, bob_qty: 0, gross_wt: 0 }]);
    }
    function removeRow(index) {
        const next = [...items];
        next.splice(index, 1);
        setItems(next);
    }
    async function saveEdit() {
        if (!editing)
            return;
        const payload = { date: editing.date, customer_id: editing.customer_id, shift_id: editing.shift_id, items };
        const res = await api.put(`/challans/${editing.id}`, payload);
        if (res.data.pdf_path)
            window.open(`/api/challans/${editing.id}/print`, '_blank');
        setEditing(null);
        setItems([]);
        await load();
    }
    async function softDelete(row) {
        setDeleteRow(row);
        setDeleteReason('');
    }
    async function confirmDelete() {
        if (!deleteRow)
            return;
        await api.delete(`/challans/${deleteRow.id}`, { params: { reason: deleteReason || undefined } });
        setDeleteRow(null);
        await load();
    }
    if (editing) {
        return (_jsxs(Stack, { spacing: 2, children: [_jsxs(Typography, { variant: "h6", children: ["Edit Challan #", String(editing.challan_no).padStart(6, '0')] }), _jsx(Card, { children: _jsx(CardContent, { children: _jsxs(Grid, { container: true, spacing: 2, children: [_jsx(Grid, { item: true, xs: 12, sm: 3, children: _jsx(TextField, { fullWidth: true, label: "Date", type: "date", value: editing.date, onChange: e => setEditing({ ...editing, date: e.target.value }), InputLabelProps: { shrink: true } }) }), _jsx(Grid, { item: true, xs: 12, sm: 5, children: _jsxs(FormControl, { fullWidth: true, children: [_jsx(InputLabel, { children: "Customer" }), _jsx(Select, { label: "Customer", value: editing.customer_id, onChange: e => setEditing({ ...editing, customer_id: Number(e.target.value) }), children: customers.map(c => _jsx(MenuItem, { value: c.id, children: c.name }, c.id)) })] }) }), _jsx(Grid, { item: true, xs: 12, sm: 4, children: _jsxs(FormControl, { fullWidth: true, children: [_jsx(InputLabel, { children: "Shift" }), _jsx(Select, { label: "Shift", value: editing.shift_id, onChange: e => setEditing({ ...editing, shift_id: Number(e.target.value) }), children: shifts.map(s => _jsx(MenuItem, { value: s.id, children: s.name }, s.id)) })] }) })] }) }) }), _jsx(Card, { children: _jsxs(CardContent, { children: [_jsx(Button, { onClick: addRow, children: "+ Add Item" }), _jsx(TableContainer, { component: Paper, sx: { mt: 2 }, children: _jsxs(Table, { size: "small", children: [_jsx(TableHead, { children: _jsxs(TableRow, { children: [_jsx(TableCell, { children: "#" }), _jsx(TableCell, { children: "Metallic" }), _jsx(TableCell, { children: "Cut" }), _jsx(TableCell, { children: "Operator" }), _jsx(TableCell, { children: "Helper" }), _jsx(TableCell, { children: "Bob" }), _jsx(TableCell, { children: "Box" }), _jsx(TableCell, { align: "right", children: "Qty" }), _jsx(TableCell, { align: "right", children: "Gross" }), _jsx(TableCell, { align: "right", children: "Tare" }), _jsx(TableCell, { align: "right", children: "Net" }), _jsx(TableCell, {})] }) }), _jsx(TableBody, { children: items.map((it, i) => {
                                                const bobWt = weightOf(bobTypes, it.bob_type_id);
                                                const boxWt = weightOf(boxTypes, it.box_type_id);
                                                const tare = it.bob_qty * bobWt + boxWt;
                                                const net = it.gross_wt - tare;
                                                return (_jsxs(TableRow, { children: [_jsx(TableCell, { children: i + 1 }), _jsx(TableCell, { children: _jsxs(Select, { size: "small", value: it.metallic_id, onChange: e => { const v = Number(e.target.value); const n = [...items]; n[i] = { ...it, metallic_id: v }; setItems(n); }, children: [_jsx(MenuItem, { value: 0, children: "Select" }), metallics.map(m => _jsx(MenuItem, { value: m.id, children: m.name }, m.id))] }) }), _jsx(TableCell, { children: _jsxs(Select, { size: "small", value: it.cut_id, onChange: e => { const v = Number(e.target.value); const n = [...items]; n[i] = { ...it, cut_id: v }; setItems(n); }, children: [_jsx(MenuItem, { value: 0, children: "Select" }), cuts.map(m => _jsx(MenuItem, { value: m.id, children: m.name }, m.id))] }) }), _jsx(TableCell, { children: _jsxs(Select, { size: "small", value: it.operator_id, onChange: e => { const v = Number(e.target.value); const n = [...items]; n[i] = { ...it, operator_id: v }; setItems(n); }, children: [_jsx(MenuItem, { value: 0, children: "Select" }), employees.filter(e => e.role_operator).map(m => _jsx(MenuItem, { value: m.id, children: m.name }, m.id))] }) }), _jsx(TableCell, { children: _jsxs(Select, { size: "small", value: it.helper_id ?? '', onChange: e => { const v = e.target.value ? Number(e.target.value) : null; const n = [...items]; n[i] = { ...it, helper_id: v }; setItems(n); }, children: [_jsx(MenuItem, { value: "", children: "None" }), employees.filter(e => e.role_helper).map(m => _jsx(MenuItem, { value: m.id, children: m.name }, m.id))] }) }), _jsx(TableCell, { children: _jsxs(Select, { size: "small", value: it.bob_type_id, onChange: e => { const v = Number(e.target.value); const n = [...items]; n[i] = { ...it, bob_type_id: v }; setItems(n); }, children: [_jsx(MenuItem, { value: 0, children: "Select" }), bobTypes.map(m => _jsx(MenuItem, { value: m.id, children: m.name }, m.id))] }) }), _jsx(TableCell, { children: _jsxs(Select, { size: "small", value: it.box_type_id, onChange: e => { const v = Number(e.target.value); const n = [...items]; n[i] = { ...it, box_type_id: v }; setItems(n); }, children: [_jsx(MenuItem, { value: 0, children: "Select" }), boxTypes.map(m => _jsx(MenuItem, { value: m.id, children: m.name }, m.id))] }) }), _jsx(TableCell, { align: "right", children: _jsx(TextField, { size: "small", type: "number", value: it.bob_qty, onChange: e => { const v = Number(e.target.value); const n = [...items]; n[i] = { ...it, bob_qty: v }; setItems(n); } }) }), _jsx(TableCell, { align: "right", children: _jsx(TextField, { size: "small", type: "number", inputProps: { step: '0.001' }, value: it.gross_wt, onChange: e => { const v = Number(e.target.value); const n = [...items]; n[i] = { ...it, gross_wt: v }; setItems(n); } }) }), _jsx(TableCell, { align: "right", children: tare.toFixed(3) }), _jsx(TableCell, { align: "right", children: net.toFixed(3) }), _jsx(TableCell, { align: "right", children: _jsx(Button, { size: "small", color: "error", variant: "outlined", onClick: () => removeRow(i), children: "Remove" }) })] }, i));
                                            }) })] }) }), _jsxs(Stack, { direction: "row", justifyContent: "flex-end", sx: { mt: 2 }, children: [_jsx(Button, { onClick: saveEdit, children: "Save Changes & Print" }), _jsx(Button, { variant: "outlined", onClick: () => { setEditing(null); setItems([]); }, children: "Cancel" })] })] }) })] }));
    }
    return (_jsxs(Stack, { spacing: 2, children: [_jsx(Typography, { variant: "h5", children: "Challans" }), _jsx(Card, { children: _jsx(CardContent, { children: _jsxs(Grid, { container: true, spacing: 2, alignItems: "center", children: [_jsx(Grid, { item: true, xs: 12, sm: 2, children: _jsx(TextField, { fullWidth: true, label: "From", type: "date", value: from, onChange: e => setFrom(e.target.value), InputLabelProps: { shrink: true } }) }), _jsx(Grid, { item: true, xs: 12, sm: 2, children: _jsx(TextField, { fullWidth: true, label: "To", type: "date", value: to, onChange: e => setTo(e.target.value), InputLabelProps: { shrink: true } }) }), _jsx(Grid, { item: true, xs: 12, sm: 3, children: _jsxs(FormControl, { fullWidth: true, children: [_jsx(InputLabel, { children: "Customer" }), _jsxs(Select, { label: "Customer", value: customerId, onChange: e => setCustomerId(e.target.value), children: [_jsx(MenuItem, { value: "", children: _jsx("em", { children: "All" }) }), customers.map(c => _jsx(MenuItem, { value: c.id, children: c.name }, c.id))] })] }) }), _jsx(Grid, { item: true, xs: 12, sm: 2, children: _jsx(TextField, { fullWidth: true, label: "Challan No", value: challanNo, onChange: e => setChallanNo(e.target.value) }) }), _jsx(Grid, { item: true, xs: 12, sm: 'auto', children: _jsx(Button, { onClick: search, children: "Search" }) })] }) }) }), _jsx(TableContainer, { component: Paper, children: _jsxs(Table, { size: "small", children: [_jsx(TableHead, { children: _jsxs(TableRow, { children: [_jsx(TableCell, { children: "Challan No" }), _jsx(TableCell, { children: "Date" }), _jsx(TableCell, { children: "Customer" }), _jsx(TableCell, { align: "right", children: "Total Bobbin" }), _jsx(TableCell, { align: "right", children: "Total Net (kg)" }), _jsx(TableCell, { align: "right", children: "Actions" })] }) }), _jsx(TableBody, { children: rows.map(r => (_jsxs(TableRow, { children: [_jsx(TableCell, { children: String(r.challan_no).padStart(6, '0') }), _jsx(TableCell, { children: dayjs(r.date).format('DD/MM/YYYY') }), _jsx(TableCell, { children: r.customer_name }), _jsx(TableCell, { align: "right", children: r.total_bob_qty }), _jsx(TableCell, { align: "right", children: Number(r.total_net_wt).toFixed(3) }), _jsx(TableCell, { align: "right", children: _jsxs(Stack, { direction: "row", spacing: 1, justifyContent: "flex-end", children: [_jsx(Button, { size: "small", onClick: () => openPdf(r), children: "Open PDF" }), _jsx(Button, { size: "small", onClick: () => startEdit(r), children: "Edit" }), _jsx(Button, { size: "small", color: "error", variant: "outlined", onClick: () => softDelete(r), children: "Delete" })] }) })] }, r.id))) })] }) }), _jsxs(Dialog, { open: !!deleteRow, onClose: () => setDeleteRow(null), children: [_jsxs(DialogTitle, { children: ["Delete Challan #", deleteRow ? String(deleteRow.challan_no).padStart(6, '0') : ''] }), _jsx(DialogContent, { children: _jsx(TextField, { label: "Reason", fullWidth: true, value: deleteReason, onChange: e => setDeleteReason(e.target.value), placeholder: "Enter reason" }) }), _jsxs(DialogActions, { children: [_jsx(Button, { onClick: () => setDeleteRow(null), variant: "outlined", children: "Cancel" }), _jsx(Button, { onClick: confirmDelete, color: "error", children: "Delete" })] })] })] }));
}
