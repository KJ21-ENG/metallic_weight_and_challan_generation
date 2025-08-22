import React, { useState, useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Layout } from './components/Layout'
import { MasterPage } from './pages/Master'
import { ChallanPage } from './pages/Challan'
import { ManagementPage } from './pages/Management'
import { SplashScreen } from './components/SplashScreen'

export function App() {
  // Check session storage immediately during component initialization
  const hasSeenSplash = sessionStorage.getItem('hasSeenSplash')
  
  // If splash has been seen, render main app immediately
  if (hasSeenSplash) {
    return (
      <Layout>
        <Routes>
        <Route path="/" element={<Navigate to="/challan" replace />} />
        <Route path="/challan" element={<ChallanPage />} />
        <Route path="/master" element={<MasterPage />} />
        <Route path="/manage" element={<ManagementPage />} />
        </Routes>
      </Layout>
    )
  }

  // Only show splash screen on first visit
  return (
    <SplashScreen 
      onComplete={() => {
        // Mark that we've seen the splash and force re-render
        sessionStorage.setItem('hasSeenSplash', 'true')
        // Force a re-render by updating a state that triggers component refresh
        window.location.reload()
      }}
      duration={5000}
    />
  )
}
