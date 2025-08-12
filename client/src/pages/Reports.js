import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { api } from '../api';
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
    return (_jsxs("div", { children: [_jsxs("div", { style: { display: 'flex', gap: 8, alignItems: 'center' }, children: [_jsxs("label", { children: ["From", _jsx("input", { type: "date", value: from, onChange: e => setFrom(e.target.value) })] }), _jsxs("label", { children: ["To", _jsx("input", { type: "date", value: to, onChange: e => setTo(e.target.value) })] }), _jsxs("label", { children: ["Group By", _jsxs("select", { value: groupBy, onChange: e => setGroupBy(e.target.value), children: [_jsx("option", { value: "metallic", children: "Metallic" }), _jsx("option", { value: "cut", children: "Cut" })] })] }), _jsx("button", { onClick: run, children: "Run" }), _jsx("button", { onClick: downloadCSV, children: "Export CSV" })] }), _jsxs("table", { style: { width: '100%', borderCollapse: 'collapse', marginTop: 12 }, children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "Group" }), _jsx("th", { children: "BobQty" }), _jsx("th", { children: "Gross" }), _jsx("th", { children: "Tare" }), _jsx("th", { children: "Net" })] }) }), _jsx("tbody", { children: rows.map((r, idx) => (_jsxs("tr", { children: [_jsx("td", { children: r.group_name }), _jsx("td", { children: r.total_bob_qty }), _jsx("td", { children: Number(r.total_gross).toFixed(3) }), _jsx("td", { children: Number(r.total_tare).toFixed(3) }), _jsx("td", { children: Number(r.total_net).toFixed(3) })] }, idx))) })] })] }));
}
