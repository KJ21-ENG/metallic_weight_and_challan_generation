import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { AppBar, Box, CssBaseline, Divider, Drawer, IconButton, List, ListItemButton, ListItemIcon, ListItemText, Toolbar, Typography } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import SettingsIcon from '@mui/icons-material/Settings';
import InventoryIcon from '@mui/icons-material/Inventory';
import AssessmentIcon from '@mui/icons-material/Assessment';
import { useLocation, useNavigate } from 'react-router-dom';
const drawerWidth = 240;
const navItems = [
    { label: 'Challan', icon: _jsx(ReceiptLongIcon, {}), path: '/challan' },
    { label: 'Master', icon: _jsx(SettingsIcon, {}), path: '/master' },
    { label: 'Manage Challans', icon: _jsx(InventoryIcon, {}), path: '/manage' },
    { label: 'Reports', icon: _jsx(AssessmentIcon, {}), path: '/reports' },
];
export function Layout({ children }) {
    const [mobileOpen, setMobileOpen] = useState(false);
    const navigate = useNavigate();
    const { pathname } = useLocation();
    const drawer = (_jsxs("div", { children: [_jsx(Toolbar, { children: _jsx(Typography, { variant: "h6", fontWeight: 700, color: "primary", children: "Challan Suite" }) }), _jsx(Divider, {}), _jsx(List, { children: navItems.map((item) => (_jsxs(ListItemButton, { selected: pathname === item.path, onClick: () => { navigate(item.path); setMobileOpen(false); }, children: [_jsx(ListItemIcon, { children: item.icon }), _jsx(ListItemText, { primary: item.label })] }, item.path))) })] }));
    return (_jsxs(Box, { sx: { display: 'flex' }, children: [_jsx(CssBaseline, {}), _jsx(AppBar, { position: "fixed", sx: { zIndex: (t) => t.zIndex.drawer + 1 }, children: _jsxs(Toolbar, { children: [_jsx(IconButton, { color: "inherit", edge: "start", onClick: () => setMobileOpen(!mobileOpen), sx: { mr: 2, display: { sm: 'none' } }, children: _jsx(MenuIcon, {}) }), _jsx(Typography, { variant: "h6", noWrap: true, component: "div", children: "Metallic Weight & Challan" })] }) }), _jsxs(Box, { component: "nav", sx: { width: { sm: drawerWidth }, flexShrink: { sm: 0 } }, "aria-label": "navigation", children: [_jsx(Drawer, { variant: "temporary", open: mobileOpen, onClose: () => setMobileOpen(false), ModalProps: { keepMounted: true }, sx: { display: { xs: 'block', sm: 'none' }, '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth } }, children: drawer }), _jsx(Drawer, { variant: "permanent", sx: { display: { xs: 'none', sm: 'block' }, '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth } }, open: true, children: drawer })] }), _jsxs(Box, { component: "main", sx: { flexGrow: 1, p: 3, width: { sm: `calc(100% - ${drawerWidth}px)` } }, children: [_jsx(Toolbar, {}), children] })] }));
}
