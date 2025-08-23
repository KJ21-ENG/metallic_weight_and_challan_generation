import React, { useState, useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Layout } from './components/Layout'
import { MasterPage } from './pages/Master'
import { ChallanPage } from './pages/Challan'
import { ManagementPage } from './pages/Management'
import { SplashScreen } from './components/SplashScreen'

export function App() {
  const [isAppReady, setIsAppReady] = useState(false)
  const [hasSeenSplash, setHasSeenSplash] = useState(false)
  
  useEffect(() => {
    // Check session storage for splash screen state
    const splashSeen = sessionStorage.getItem('hasSeenSplash')
    if (splashSeen) {
      setHasSeenSplash(true)
    }
    
    // Simulate app loading process
    const loadApp = async () => {
      try {
        // Wait for any critical resources to load
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // Mark app as ready
        setIsAppReady(true)
      } catch (error) {
        console.error('Error loading app:', error)
        // Even if there's an error, mark as ready to avoid infinite loading
        setIsAppReady(true)
      }
    }
    
    loadApp()
  }, [])

  // If splash has been seen and app is ready, render main app
  if (hasSeenSplash && isAppReady) {
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

  // Show splash screen until app is ready
  return (
    <SplashScreen 
      onComplete={() => {
        // Mark that we've seen the splash
        sessionStorage.setItem('hasSeenSplash', 'true')
        setHasSeenSplash(true)
      }}
      isAppReady={isAppReady}
      minDuration={5000} // Minimum 5 seconds, but can be longer if app takes time
    />
  )
}
