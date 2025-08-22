import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { MasterPage } from './pages/Master';
import { ChallanPage } from './pages/Challan';
import { ManagementPage } from './pages/Management';
import { SplashScreen } from './components/SplashScreen';
export function App() {
    // Check session storage immediately during component initialization
    const hasSeenSplash = sessionStorage.getItem('hasSeenSplash');
    // If splash has been seen, render main app immediately
    if (hasSeenSplash) {
        return (_jsx(Layout, { children: _jsxs(Routes, { children: [_jsx(Route, { path: "/", element: _jsx(Navigate, { to: "/challan", replace: true }) }), _jsx(Route, { path: "/challan", element: _jsx(ChallanPage, {}) }), _jsx(Route, { path: "/master", element: _jsx(MasterPage, {}) }), _jsx(Route, { path: "/manage", element: _jsx(ManagementPage, {}) })] }) }));
    }
    // Only show splash screen on first visit
    return (_jsx(SplashScreen, { onComplete: () => {
            // Mark that we've seen the splash and force re-render
            sessionStorage.setItem('hasSeenSplash', 'true');
            // Force a re-render by updating a state that triggers component refresh
            window.location.reload();
        }, duration: 5000 }));
}
