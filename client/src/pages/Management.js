import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import { api, getOptions } from '../api';
export function ManagementPage() {
    const [rows, setRows] = useState([]);
    const [from, setFrom] = useState('');
    const [to, setTo] = useState('');
    const [editing, setEditing] = useState(null);
    const [items, setItems] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [shifts, setShifts] = useState([]);
    const [metallics, setMetallics] = useState([]);
    const [cuts, setCuts] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [bobTypes, setBobTypes] = useState([]);
    const [boxTypes, setBoxTypes] = useState([]);
    useEffect(() => { load(); }, []);
    async function load() {
        const res = await api.get('/challans');
        setRows(res.data);
    }
    async function search() {
        const res = await api.get('/challans', { params: { from, to } });
        setRows(res.data);
    }
    function openPdf(row) {
        if (row.pdf_path)
            window.open(`/files/${row.pdf_path}`, '_blank');
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
        // load masters if not yet
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
    function weightOf(opts, id) { return opts.find(o => o.id === id)?.weight_kg || 0; }
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
            window.open(`/files/${res.data.pdf_path}`, '_blank');
        setEditing(null);
        setItems([]);
        await load();
    }
    async function softDelete(row) {
        const reason = window.prompt('Reason for delete?') || '';
        await api.delete(`/challans/${row.id}`, { params: { reason } });
        await load();
    }
    if (editing) {
        return (_jsxs("div", { children: [_jsxs("h4", { children: ["Edit Challan #", String(editing.challan_no).padStart(6, '0')] }), _jsxs("div", { style: { display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 8 }, children: [_jsxs("label", { children: ["Date", _jsx("input", { type: "date", value: editing.date, onChange: e => setEditing({ ...editing, date: e.target.value }) })] }), _jsxs("label", { children: ["Customer", _jsxs("select", { value: editing.customer_id, onChange: e => setEditing({ ...editing, customer_id: Number(e.target.value) }), children: [_jsx("option", { value: "", children: "Select" }), customers.map(c => _jsx("option", { value: c.id, children: c.name }, c.id))] })] }), _jsxs("label", { children: ["Shift", _jsxs("select", { value: editing.shift_id, onChange: e => setEditing({ ...editing, shift_id: Number(e.target.value) }), children: [_jsx("option", { value: "", children: "Select" }), shifts.map(s => _jsx("option", { value: s.id, children: s.name }, s.id))] })] })] }), _jsx("div", { style: { marginTop: 12 }, children: _jsx("button", { onClick: addRow, children: "+ Add Item" }) }), _jsxs("table", { style: { width: '100%', borderCollapse: 'collapse', marginTop: 8 }, children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "#" }), _jsx("th", { children: "Metallic" }), _jsx("th", { children: "Cut" }), _jsx("th", { children: "Operator" }), _jsx("th", { children: "Helper" }), _jsx("th", { children: "Bob" }), _jsx("th", { children: "Box" }), _jsx("th", { children: "Qty" }), _jsx("th", { children: "Gross" }), _jsx("th", { children: "Tare" }), _jsx("th", { children: "Net" }), _jsx("th", {})] }) }), _jsx("tbody", { children: items.map((it, i) => {
                                const bobWt = weightOf(bobTypes, it.bob_type_id);
                                const boxWt = weightOf(boxTypes, it.box_type_id);
                                const tare = it.bob_qty * bobWt + boxWt;
                                const net = it.gross_wt - tare;
                                return (_jsxs("tr", { children: [_jsx("td", { children: i + 1 }), _jsx("td", { children: _jsxs("select", { value: it.metallic_id, onChange: e => { const v = Number(e.target.value); const n = [...items]; n[i] = { ...it, metallic_id: v }; setItems(n); }, children: [_jsx("option", { value: 0, children: "Select" }), metallics.map(m => _jsx("option", { value: m.id, children: m.name }, m.id))] }) }), _jsx("td", { children: _jsxs("select", { value: it.cut_id, onChange: e => { const v = Number(e.target.value); const n = [...items]; n[i] = { ...it, cut_id: v }; setItems(n); }, children: [_jsx("option", { value: 0, children: "Select" }), cuts.map(m => _jsx("option", { value: m.id, children: m.name }, m.id))] }) }), _jsx("td", { children: _jsxs("select", { value: it.operator_id, onChange: e => { const v = Number(e.target.value); const n = [...items]; n[i] = { ...it, operator_id: v }; setItems(n); }, children: [_jsx("option", { value: 0, children: "Select" }), employees.filter(e => e.role_operator).map(m => _jsx("option", { value: m.id, children: m.name }, m.id))] }) }), _jsx("td", { children: _jsxs("select", { value: it.helper_id ?? '', onChange: e => { const v = e.target.value ? Number(e.target.value) : null; const n = [...items]; n[i] = { ...it, helper_id: v }; setItems(n); }, children: [_jsx("option", { value: "", children: "None" }), employees.filter(e => e.role_helper).map(m => _jsx("option", { value: m.id, children: m.name }, m.id))] }) }), _jsx("td", { children: _jsxs("select", { value: it.bob_type_id, onChange: e => { const v = Number(e.target.value); const n = [...items]; n[i] = { ...it, bob_type_id: v }; setItems(n); }, children: [_jsx("option", { value: 0, children: "Select" }), bobTypes.map(m => _jsx("option", { value: m.id, children: m.name }, m.id))] }) }), _jsx("td", { children: _jsxs("select", { value: it.box_type_id, onChange: e => { const v = Number(e.target.value); const n = [...items]; n[i] = { ...it, box_type_id: v }; setItems(n); }, children: [_jsx("option", { value: 0, children: "Select" }), boxTypes.map(m => _jsx("option", { value: m.id, children: m.name }, m.id))] }) }), _jsx("td", { children: _jsx("input", { type: "number", value: it.bob_qty, onChange: e => { const v = Number(e.target.value); const n = [...items]; n[i] = { ...it, bob_qty: v }; setItems(n); } }) }), _jsx("td", { children: _jsx("input", { type: "number", step: "0.001", value: it.gross_wt, onChange: e => { const v = Number(e.target.value); const n = [...items]; n[i] = { ...it, gross_wt: v }; setItems(n); } }) }), _jsx("td", { children: tare.toFixed(3) }), _jsx("td", { children: net.toFixed(3) }), _jsx("td", { children: _jsx("button", { onClick: () => removeRow(i), children: "Remove" }) })] }, i));
                            }) })] }), _jsxs("div", { style: { marginTop: 12, display: 'flex', gap: 8 }, children: [_jsx("button", { onClick: saveEdit, children: "Save Changes" }), _jsx("button", { onClick: () => { setEditing(null); setItems([]); }, children: "Cancel" })] })] }));
    }
    return (_jsxs("div", { children: [_jsxs("div", { style: { display: 'flex', gap: 8, alignItems: 'center' }, children: [_jsxs("label", { children: ["From", _jsx("input", { type: "date", value: from, onChange: e => setFrom(e.target.value) })] }), _jsxs("label", { children: ["To", _jsx("input", { type: "date", value: to, onChange: e => setTo(e.target.value) })] }), _jsx("button", { onClick: search, children: "Search" })] }), _jsxs("table", { style: { width: '100%', borderCollapse: 'collapse', marginTop: 12 }, children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "ID" }), _jsx("th", { children: "Challan No" }), _jsx("th", { children: "Date" }), _jsx("th", { children: "Actions" })] }) }), _jsx("tbody", { children: rows.map(r => (_jsxs("tr", { children: [_jsx("td", { children: r.id }), _jsx("td", { children: String(r.challan_no).padStart(6, '0') }), _jsx("td", { children: dayjs(r.date).format('DD/MM/YYYY') }), _jsxs("td", { style: { display: 'flex', gap: 8 }, children: [_jsx("button", { onClick: () => openPdf(r), children: "Open PDF" }), _jsx("button", { onClick: () => startEdit(r), children: "Edit" }), _jsx("button", { onClick: () => softDelete(r), children: "Delete" })] })] }, r.id))) })] })] }));
}
