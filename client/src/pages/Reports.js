import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { api } from '../api';
import { Button, Card, CardContent, Grid, Stack, TextField, Typography, TableContainer, Paper, Table, TableHead, TableRow, TableCell, TableBody, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
export function ReportsPage() {
    const [from, setFrom] = useState('');
    const [to, setTo] = useState('');
    const [groupBy, setGroupBy] = useState('metallic');
    const [rows, setRows] = useState([]);
    async function run() {
        const res = await api.get('/reports/summary', { params: { from, to, groupBy } });
        setRows(res.data);
    }
    function downloadCSV() {
        const url = `/api/reports/summary.csv?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&groupBy=${groupBy}`;
        window.open(url, '_blank');
    }
    return (_jsxs(Stack, { spacing: 2, children: [_jsx(Typography, { variant: "h5", children: "Reports" }), _jsx(Card, { children: _jsx(CardContent, { children: _jsxs(Grid, { container: true, spacing: 2, alignItems: "center", children: [_jsx(Grid, { item: true, xs: 12, sm: 3, children: _jsx(TextField, { fullWidth: true, label: "From", type: "date", value: from, onChange: e => setFrom(e.target.value), InputLabelProps: { shrink: true } }) }), _jsx(Grid, { item: true, xs: 12, sm: 3, children: _jsx(TextField, { fullWidth: true, label: "To", type: "date", value: to, onChange: e => setTo(e.target.value), InputLabelProps: { shrink: true } }) }), _jsx(Grid, { item: true, xs: 12, sm: 3, children: _jsxs(FormControl, { fullWidth: true, children: [_jsx(InputLabel, { children: "Group By" }), _jsxs(Select, { label: "Group By", value: groupBy, onChange: e => setGroupBy(e.target.value), children: [_jsx(MenuItem, { value: "metallic", children: "Metallic" }), _jsx(MenuItem, { value: "cut", children: "Cut" })] })] }) }), _jsx(Grid, { item: true, xs: 12, sm: 'auto', children: _jsx(Button, { onClick: run, children: "Run" }) }), _jsx(Grid, { item: true, xs: 12, sm: 'auto', children: _jsx(Button, { variant: "outlined", onClick: downloadCSV, children: "Export CSV" }) })] }) }) }), _jsx(TableContainer, { component: Paper, children: _jsxs(Table, { size: "small", children: [_jsx(TableHead, { children: _jsxs(TableRow, { children: [_jsx(TableCell, { children: "Group" }), _jsx(TableCell, { children: "BobQty" }), _jsx(TableCell, { children: "Gross" }), _jsx(TableCell, { children: "Tare" }), _jsx(TableCell, { children: "Net" })] }) }), _jsx(TableBody, { children: rows.map((r, idx) => (_jsxs(TableRow, { children: [_jsx(TableCell, { children: r.group_name }), _jsx(TableCell, { children: r.total_bob_qty }), _jsx(TableCell, { children: Number(r.total_gross).toFixed(3) }), _jsx(TableCell, { children: Number(r.total_tare).toFixed(3) }), _jsx(TableCell, { children: Number(r.total_net).toFixed(3) })] }, idx))) })] }) })] }));
}
