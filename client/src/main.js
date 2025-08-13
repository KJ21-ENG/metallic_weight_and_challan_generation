import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AppTheme } from './theme';
import { App } from './App';
createRoot(document.getElementById('root')).render(_jsx(React.StrictMode, { children: _jsx(AppTheme, { children: _jsx(BrowserRouter, { children: _jsx(App, {}) }) }) }));
