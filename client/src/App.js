import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { MasterPage } from './pages/Master';
import { ChallanPage } from './pages/Challan';
import { ManagementPage } from './pages/Management';
export function App() {
    return (_jsx(Layout, { children: _jsxs(Routes, { children: [_jsx(Route, { path: "/", element: _jsx(Navigate, { to: "/challan", replace: true }) }), _jsx(Route, { path: "/challan", element: _jsx(ChallanPage, {}) }), _jsx(Route, { path: "/master", element: _jsx(MasterPage, {}) }), _jsx(Route, { path: "/manage", element: _jsx(ManagementPage, {}) })] }) }));
}
