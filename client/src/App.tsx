import { useState } from 'react'
import { MasterPage } from './pages/Master'
import { ChallanPage } from './pages/Challan'
import { ManagementPage } from './pages/Management'
import { ReportsPage } from './pages/Reports'

const tabs = [
  { key: 'challan', label: 'Challan' },
  { key: 'master', label: 'Master' },
  { key: 'manage', label: 'Manage Challans' },
  { key: 'reports', label: 'Reports' },
]

export function App() {
  const [tab, setTab] = useState('challan')
  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', padding: 16 }}>
      <h2>Metallic Weight & Challan</h2>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{ padding: '6px 12px', background: tab === t.key ? '#333' : '#eee', color: tab === t.key ? '#fff' : '#000', border: '1px solid #ccc' }}>{t.label}</button>
        ))}
      </div>
      {tab === 'master' && <MasterPage />}
      {tab === 'challan' && <ChallanPage />}
      {tab === 'manage' && <ManagementPage />}
      {tab === 'reports' && <ReportsPage />}
    </div>
  )
}
