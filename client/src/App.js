import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { MasterPage } from './pages/Master';
import { ChallanPage } from './pages/Challan';
import { ManagementPage } from './pages/Management';
import { ReportsPage } from './pages/Reports';
const tabs = [
    { key: 'challan', label: 'Challan' },
    { key: 'master', label: 'Master' },
    { key: 'manage', label: 'Manage Challans' },
    { key: 'reports', label: 'Reports' },
];
export function App() {
    const [tab, setTab] = useState('challan');
    return (_jsxs("div", { style: { fontFamily: 'system-ui, sans-serif', padding: 16 }, children: [_jsx("h2", { children: "Metallic Weight & Challan" }), _jsx("div", { style: { display: 'flex', gap: 8, marginBottom: 12 }, children: tabs.map(t => (_jsx("button", { onClick: () => setTab(t.key), style: { padding: '6px 12px', background: tab === t.key ? '#333' : '#eee', color: tab === t.key ? '#fff' : '#000', border: '1px solid #ccc' }, children: t.label }, t.key))) }), tab === 'master' && _jsx(MasterPage, {}), tab === 'challan' && _jsx(ChallanPage, {}), tab === 'manage' && _jsx(ManagementPage, {}), tab === 'reports' && _jsx(ReportsPage, {})] }));
}
