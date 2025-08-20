import { Routes, Route, Navigate } from 'react-router-dom'
import { Layout } from './components/Layout'
import { MasterPage } from './pages/Master'
import { ChallanPage } from './pages/Challan'
import { ManagementPage } from './pages/Management'

export function App() {
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
