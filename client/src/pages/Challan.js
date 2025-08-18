import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import { api, getOptions } from '../api';
import { printLabel, getLabelPrinter } from '../utils/printer';
import { Box, Button, Card, CardContent, FormControl, Grid, InputLabel, MenuItem, Select, Stack, TextField, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
export function ChallanPage() {
    const [date, setDate] = useState(dayjs().format('YYYY-MM-DD'));
    const [customers, setCustomers] = useState([]);
    const [firms, setFirms] = useState([]);
    const [shifts, setShifts] = useState([]);
    const [metallics, setMetallics] = useState([]);
    const [cuts, setCuts] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [bobTypes, setBobTypes] = useState([]);
    const [boxTypes, setBoxTypes] = useState([]);
    const [customerId, setCustomerId] = useState('');
    const [shiftId, setShiftId] = useState('');
    const [firmId, setFirmId] = useState('');
    const [form, setForm] = useState({ metallic_id: 0, cut_id: 0, operator_id: 0, helper_id: null, bob_type_id: 0, box_type_id: 0, bob_qty: 0, gross_wt: 0 });
    const [basket, setBasket] = useState([]);
    useEffect(() => {
        (async () => {
            const [c, s, m, cu, e, bt, bx, f] = await Promise.all([
                getOptions('customers'),
                getOptions('shifts'),
                getOptions('metallics'),
                getOptions('cuts'),
                getOptions('employees'),
                getOptions('bob_types'),
                getOptions('box_types'),
                getOptions('firms'),
            ]);
            setCustomers(c);
            setShifts(s);
            setMetallics(m);
            setCuts(cu);
            setEmployees(e);
            setBobTypes(bt);
            setBoxTypes(bx);
            setFirms(f);
            // Auto-select first customer and shift if not chosen
            if (!customerId && c.length)
                setCustomerId(c[0].id);
            if (!shiftId && s.length)
                setShiftId(s[0].id);
            if (!firmId && f.length)
                setFirmId(f[0].id);
            // Do not reserve challan number on load; final challan_no will be assigned on save.
        })();
    }, []);
    function weightOf(opts, id) { return Number(opts.find(o => Number(o.id) === Number(id))?.weight_kg ?? 0); }
    const round3 = (n) => Math.round((Number.isFinite(n) ? n : 0) * 1000) / 1000;
    function nameOf(opts, id) { return opts.find(o => Number(o.id) === Number(id))?.name || ''; }
    const bobWt = useMemo(() => weightOf(bobTypes, form.bob_type_id), [JSON.stringify(bobTypes), form.bob_type_id]);
    const boxWt = useMemo(() => weightOf(boxTypes, form.box_type_id), [JSON.stringify(boxTypes), form.box_type_id]);
    const tare = useMemo(() => round3((Number(form.bob_qty) || 0) * bobWt + boxWt), [form.bob_qty, bobWt, boxWt]);
    const net = useMemo(() => round3((Number(form.gross_wt) || 0) - tare), [form.gross_wt, tare]);
    function addToBasket() {
        setBasket([...basket, form]);
        // Print label for the added item
        const item = form; // Use the current form data
        const labelData = {
            header: 'SURYARAJ POLYMER',
            dateText: dayjs(date).format('DD/MM/YYYY\nHH:mm'),
            color: nameOf(metallics, item.metallic_id),
            cut: nameOf(cuts, item.cut_id),
            bobQty: item.bob_qty,
            gross: item.gross_wt,
            bobWeight: weightOf(bobTypes, item.bob_type_id),
            boxWeight: weightOf(boxTypes, item.box_type_id),
            net: net,
            operator: nameOf(employees, item.operator_id),
            helper: item.helper_id ? nameOf(employees, item.helper_id) : '',
            barcode: `CH${dayjs(date).format('YY')}${String(Math.floor(Math.random() * 1000000)).padStart(6, '0')}`,
            // Add the fields that the printer utility expects
            tare: tare,
            boxType: nameOf(bobTypes, item.bob_type_id)
        };
        // Print the label automatically
        printLabel(labelData).then(success => {
            if (success) {
                console.log('Label printed successfully');
                // Show success message to user
                const successMsg = `Label printed to ${getLabelPrinter() || 'configured printer'}`;
                // You can replace this with a proper notification system
                console.log(successMsg);
            }
            else {
                console.warn('Label printing failed');
                // Show warning to user
                console.warn('Label printing failed. Please check printer configuration.');
            }
        });
        // Reset form for next entry
        setForm({ metallic_id: 0, cut_id: 0, operator_id: 0, helper_id: null, bob_type_id: 0, box_type_id: 0, bob_qty: 0, gross_wt: 0 });
    }
    function removeFromBasket(index) {
        const next = [...basket];
        next.splice(index, 1);
        setBasket(next);
    }
    async function generateChallan() {
        if (!customerId || !shiftId || basket.length === 0)
            return alert('Fill header and add items');
        const payload = { date, customer_id: Number(customerId), shift_id: Number(shiftId), firm_id: firmId ? Number(firmId) : undefined, items: basket };
        const res = await api.post('/challans', payload);
        const id = res.data.challan.id;
        alert(`Challan generated successfully! ID: ${id}`);
        setBasket([]);
    }
    const disableWeights = true;
    return (_jsxs(Stack, { spacing: 2, children: [_jsx(Typography, { variant: "h5", children: "Generate Challan" }), _jsx(Card, { children: _jsx(CardContent, { children: _jsxs(Grid, { container: true, spacing: 2, children: [_jsx(Grid, { item: true, xs: 12, sm: 3, children: _jsx(TextField, { fullWidth: true, label: "Date", type: "date", value: date, onChange: e => setDate(e.target.value), InputLabelProps: { shrink: true } }) }), _jsx(Grid, { item: true, xs: 12, sm: 3, children: _jsxs(FormControl, { fullWidth: true, children: [_jsx(InputLabel, { children: "Customer" }), _jsxs(Select, { label: "Customer", value: customerId, onChange: e => setCustomerId(Number(e.target.value)), children: [_jsx(MenuItem, { value: "", children: _jsx("em", { children: "Select" }) }), customers.map(c => _jsx(MenuItem, { value: c.id, children: c.name }, c.id))] })] }) }), _jsx(Grid, { item: true, xs: 12, sm: 3, children: _jsxs(FormControl, { fullWidth: true, children: [_jsx(InputLabel, { children: "Shift" }), _jsxs(Select, { label: "Shift", value: shiftId, onChange: e => setShiftId(Number(e.target.value)), children: [_jsx(MenuItem, { value: "", children: _jsx("em", { children: "Select" }) }), shifts.map(s => _jsx(MenuItem, { value: s.id, children: s.name }, s.id))] })] }) }), _jsx(Grid, { item: true, xs: 12, sm: 3, children: _jsxs(FormControl, { fullWidth: true, children: [_jsx(InputLabel, { children: "Firm" }), _jsxs(Select, { label: "Firm", value: firmId, onChange: e => setFirmId(Number(e.target.value)), children: [_jsx(MenuItem, { value: "", children: _jsx("em", { children: "Select" }) }), firms.map((f) => _jsx(MenuItem, { value: f.id, children: f.name }, f.id))] })] }) })] }) }) }), _jsx(Card, { children: _jsxs(CardContent, { children: [_jsxs(Grid, { container: true, spacing: 2, children: [_jsx(Grid, { item: true, xs: 12, sm: 3, children: _jsxs(FormControl, { fullWidth: true, children: [_jsx(InputLabel, { children: "Metallic" }), _jsxs(Select, { label: "Metallic", value: form.metallic_id, onChange: e => setForm({ ...form, metallic_id: Number(e.target.value) }), children: [_jsx(MenuItem, { value: 0, children: _jsx("em", { children: "Select" }) }), metallics.map(m => _jsx(MenuItem, { value: m.id, children: m.name }, m.id))] })] }) }), _jsx(Grid, { item: true, xs: 12, sm: 3, children: _jsxs(FormControl, { fullWidth: true, children: [_jsx(InputLabel, { children: "Cut" }), _jsxs(Select, { label: "Cut", value: form.cut_id, onChange: e => setForm({ ...form, cut_id: Number(e.target.value) }), children: [_jsx(MenuItem, { value: 0, children: _jsx("em", { children: "Select" }) }), cuts.map(c => _jsx(MenuItem, { value: c.id, children: c.name }, c.id))] })] }) }), _jsx(Grid, { item: true, xs: 12, sm: 3, children: _jsxs(FormControl, { fullWidth: true, children: [_jsx(InputLabel, { children: "Operator" }), _jsxs(Select, { label: "Operator", value: form.operator_id, onChange: e => setForm({ ...form, operator_id: Number(e.target.value) }), children: [_jsx(MenuItem, { value: 0, children: _jsx("em", { children: "Select" }) }), employees.filter(e => e.role_operator).map(e => _jsx(MenuItem, { value: e.id, children: e.name }, e.id))] })] }) }), _jsx(Grid, { item: true, xs: 12, sm: 3, children: _jsxs(FormControl, { fullWidth: true, children: [_jsx(InputLabel, { children: "Helper" }), _jsxs(Select, { label: "Helper", value: form.helper_id || '', onChange: e => setForm({ ...form, helper_id: e.target.value ? Number(e.target.value) : null }), children: [_jsx(MenuItem, { value: "", children: _jsx("em", { children: "None" }) }), employees.filter(e => e.role_helper).map(e => _jsx(MenuItem, { value: e.id, children: e.name }, e.id))] })] }) }), _jsx(Grid, { item: true, xs: 12, sm: 3, children: _jsxs(FormControl, { fullWidth: true, children: [_jsx(InputLabel, { children: "Bob Type" }), _jsxs(Select, { label: "Bob Type", value: form.bob_type_id, onChange: e => setForm({ ...form, bob_type_id: Number(e.target.value) }), children: [_jsx(MenuItem, { value: 0, children: _jsx("em", { children: "Select" }) }), bobTypes.map(b => _jsxs(MenuItem, { value: b.id, children: [b.name, " (", b.weight_kg, " kg)"] }, b.id))] })] }) }), _jsx(Grid, { item: true, xs: 12, sm: 3, children: _jsxs(FormControl, { fullWidth: true, children: [_jsx(InputLabel, { children: "Box Type" }), _jsxs(Select, { label: "Box Type", value: form.box_type_id, onChange: e => setForm({ ...form, box_type_id: Number(e.target.value) }), children: [_jsx(MenuItem, { value: 0, children: _jsx("em", { children: "Select" }) }), boxTypes.map(b => _jsxs(MenuItem, { value: b.id, children: [b.name, " (", b.weight_kg, " kg)"] }, b.id))] })] }) }), _jsx(Grid, { item: true, xs: 12, sm: 3, children: _jsx(TextField, { fullWidth: true, label: "Bob Qty", type: "number", value: form.bob_qty, onChange: e => setForm({ ...form, bob_qty: Number(e.target.value) }), inputProps: { min: 0 } }) }), _jsx(Grid, { item: true, xs: 12, sm: 3, children: _jsx(TextField, { fullWidth: true, label: "Gross Weight (kg)", type: "number", value: form.gross_wt, onChange: e => setForm({ ...form, gross_wt: Number(e.target.value) }), inputProps: { min: 0, step: 0.001 } }) })] }), _jsx(Box, { sx: { mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }, children: _jsxs(Grid, { container: true, spacing: 2, children: [_jsx(Grid, { item: true, xs: 12, sm: 3, children: _jsxs(Typography, { variant: "body2", color: "textSecondary", children: ["Bob Weight: ", bobWt.toFixed(3), " kg"] }) }), _jsx(Grid, { item: true, xs: 12, sm: 3, children: _jsxs(Typography, { variant: "body2", color: "textSecondary", children: ["Box Weight: ", boxWt.toFixed(3), " kg"] }) }), _jsx(Grid, { item: true, xs: 12, sm: 3, children: _jsxs(Typography, { variant: "body2", color: "textSecondary", children: ["Tare Weight: ", tare.toFixed(3), " kg"] }) }), _jsx(Grid, { item: true, xs: 12, sm: 3, children: _jsxs(Typography, { variant: "body2", color: "textSecondary", children: ["Net Weight: ", net.toFixed(3), " kg"] }) })] }) }), _jsx(Stack, { direction: "row", justifyContent: "flex-end", sx: { mt: 2 }, children: _jsx(Grid, { item: true, xs: 12, sm: 2, children: _jsx(Button, { fullWidth: true, onClick: addToBasket, children: "Add to Basket" }) }) })] }) }), _jsx(Card, { children: _jsxs(CardContent, { children: [_jsx(Typography, { variant: "h6", gutterBottom: true, children: "Basket" }), _jsx(TableContainer, { component: Paper, children: _jsxs(Table, { size: "small", children: [_jsx(TableHead, { children: _jsxs(TableRow, { children: [_jsx(TableCell, { children: "#" }), _jsx(TableCell, { children: "Metallic" }), _jsx(TableCell, { children: "Cut" }), _jsx(TableCell, { children: "Bob" }), _jsx(TableCell, { children: "Box" }), _jsx(TableCell, { align: "right", children: "Qty" }), _jsx(TableCell, { align: "right", children: "Gross" }), _jsx(TableCell, { align: "right", children: "Tare" }), _jsx(TableCell, { align: "right", children: "Net" }), _jsx(TableCell, { align: "right" })] }) }), _jsxs(TableBody, { children: [basket.map((b, i) => {
                                                const bobWt = weightOf(bobTypes, b.bob_type_id);
                                                const boxWt = weightOf(boxTypes, b.box_type_id);
                                                const t = round3((Number(b.bob_qty) || 0) * bobWt + boxWt);
                                                const n = round3((Number(b.gross_wt) || 0) - t);
                                                return (_jsxs(TableRow, { children: [_jsx(TableCell, { children: i + 1 }), _jsx(TableCell, { children: nameOf(metallics, b.metallic_id) }), _jsx(TableCell, { children: nameOf(cuts, b.cut_id) }), _jsx(TableCell, { children: nameOf(bobTypes, b.bob_type_id) }), _jsx(TableCell, { children: nameOf(boxTypes, b.box_type_id) }), _jsx(TableCell, { align: "right", children: b.bob_qty }), _jsx(TableCell, { align: "right", children: b.gross_wt.toFixed(3) }), _jsx(TableCell, { align: "right", children: t.toFixed(3) }), _jsx(TableCell, { align: "right", children: n.toFixed(3) }), _jsx(TableCell, { align: "right", children: _jsx(Button, { size: "small", color: "error", variant: "outlined", onClick: () => removeFromBasket(i), children: "Remove" }) })] }, i));
                                            }), basket.length > 0 && (() => {
                                                const totals = basket.reduce((acc, b) => {
                                                    const bobWt = weightOf(bobTypes, b.bob_type_id);
                                                    const boxWt = weightOf(boxTypes, b.box_type_id);
                                                    const t = round3((Number(b.bob_qty) || 0) * bobWt + boxWt);
                                                    const n = round3((Number(b.gross_wt) || 0) - t);
                                                    acc.qty += Number(b.bob_qty) || 0;
                                                    acc.net += n;
                                                    return acc;
                                                }, { qty: 0, net: 0 });
                                                return (_jsxs(TableRow, { children: [_jsx(TableCell, { colSpan: 5, children: _jsx("b", { children: "Totals" }) }), _jsx(TableCell, { align: "right", children: _jsx("b", { children: totals.qty }) }), _jsx(TableCell, {}), _jsx(TableCell, {}), _jsx(TableCell, { align: "right", children: _jsx("b", { children: totals.net.toFixed(3) }) }), _jsx(TableCell, {})] }));
                                            })()] })] }) }), _jsx(Stack, { direction: "row", justifyContent: "flex-end", sx: { mt: 2 }, children: _jsx(Button, { size: "large", onClick: generateChallan, disabled: !customerId || !shiftId || basket.length === 0, children: "Generate Challan" }) })] }) })] }));
}
