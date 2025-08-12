import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { api, getOptions } from '../api';
const masterTabs = [
    { key: 'metallics', label: 'Metallic' },
    { key: 'cuts', label: 'Cut' },
    { key: 'employees', label: 'Employees' },
    { key: 'bob_types', label: 'Bob Type' },
    { key: 'box_types', label: 'Box Type' },
    { key: 'customers', label: 'Customers' },
    { key: 'shifts', label: 'Shifts' },
];
export function MasterPage() {
    const [type, setType] = useState('metallics');
    const [items, setItems] = useState([]);
    const [name, setName] = useState('');
    const [weight, setWeight] = useState('');
    const isWeighted = type === 'bob_types' || type === 'box_types';
    useEffect(() => { load(); }, [type]);
    async function load() {
        const data = await getOptions(type);
        setItems(data);
    }
    async function add() {
        if (!name.trim())
            return;
        const body = { name };
        if (isWeighted)
            body.weight_kg = Number(weight || 0);
        const res = await api.post(`/master/${type}`, body);
        setName('');
        setWeight('');
        setItems([...items, res.data]);
    }
    async function remove(id) {
        await api.delete(`/master/${type}/${id}`);
        setItems(items.filter(i => i.id !== id));
    }
    return (_jsxs("div", { children: [_jsx("div", { style: { display: 'flex', gap: 6, marginBottom: 12 }, children: masterTabs.map(t => (_jsx("button", { onClick: () => setType(t.key), style: { padding: '6px 10px', background: type === t.key ? '#444' : '#eee', color: type === t.key ? '#fff' : '#000' }, children: t.label }, t.key))) }), _jsxs("div", { style: { display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }, children: [_jsx("input", { placeholder: "Name", value: name, onChange: e => setName(e.target.value) }), isWeighted && (_jsx("input", { placeholder: "Weight (kg)", type: "number", step: "0.001", value: weight, onChange: e => setWeight(e.target.value) })), _jsx("button", { onClick: add, children: "+ New" })] }), _jsxs("table", { style: { width: '100%', borderCollapse: 'collapse' }, children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { style: { textAlign: 'left' }, children: "Name" }), isWeighted && _jsx("th", { style: { textAlign: 'right' }, children: "Weight (kg)" }), _jsx("th", {})] }) }), _jsx("tbody", { children: items.map(i => (_jsxs("tr", { children: [_jsx("td", { children: i.name }), isWeighted && _jsx("td", { style: { textAlign: 'right' }, children: i.weight_kg?.toFixed?.(3) }), _jsx("td", { children: _jsx("button", { onClick: () => remove(i.id), children: "Delete" }) })] }, i.id))) })] })] }));
}
