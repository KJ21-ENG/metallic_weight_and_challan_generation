import { useState } from 'react'
import { api } from '../api'

export function ReportsPage() {
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [groupBy, setGroupBy] = useState<'metallic' | 'cut'>('metallic')
  const [rows, setRows] = useState<any[]>([])

  async function run() {
    const res = await api.get('/reports/summary', { params: { from, to, groupBy } })
    setRows(res.data)
  }

  function downloadCSV() {
    const url = `/api/reports/summary.csv?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&groupBy=${groupBy}`
    window.open(url, '_blank')
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <label>From<input type="date" value={from} onChange={e => setFrom(e.target.value)} /></label>
        <label>To<input type="date" value={to} onChange={e => setTo(e.target.value)} /></label>
        <label>Group By<select value={groupBy} onChange={e => setGroupBy(e.target.value as any)}><option value="metallic">Metallic</option><option value="cut">Cut</option></select></label>
        <button onClick={run}>Run</button>
        <button onClick={downloadCSV}>Export CSV</button>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 12 }}>
        <thead><tr><th>Group</th><th>BobQty</th><th>Gross</th><th>Tare</th><th>Net</th></tr></thead>
        <tbody>
          {rows.map((r, idx) => (
            <tr key={idx}><td>{r.group_name}</td><td>{r.total_bob_qty}</td><td>{Number(r.total_gross).toFixed(3)}</td><td>{Number(r.total_tare).toFixed(3)}</td><td>{Number(r.total_net).toFixed(3)}</td></tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
