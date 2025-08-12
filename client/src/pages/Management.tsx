import { useEffect, useState } from 'react'
import dayjs from 'dayjs'
import { api, getOptions } from '../api'

type Option = { id: number; name: string; weight_kg?: number; role_operator?: boolean; role_helper?: boolean }

type BasketItem = {
  metallic_id: number
  cut_id: number
  operator_id: number
  helper_id?: number | null
  bob_type_id: number
  box_type_id: number
  bob_qty: number
  gross_wt: number
}

export function ManagementPage() {
  const [rows, setRows] = useState<any[]>([])
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')

  const [editing, setEditing] = useState<null | { id: number, challan_no: number, date: string, customer_id: number, shift_id: number }>(null)
  const [items, setItems] = useState<BasketItem[]>([])

  const [customers, setCustomers] = useState<Option[]>([])
  const [shifts, setShifts] = useState<Option[]>([])
  const [metallics, setMetallics] = useState<Option[]>([])
  const [cuts, setCuts] = useState<Option[]>([])
  const [employees, setEmployees] = useState<Option[]>([])
  const [bobTypes, setBobTypes] = useState<Option[]>([])
  const [boxTypes, setBoxTypes] = useState<Option[]>([])

  useEffect(() => { load() }, [])

  async function load() {
    const res = await api.get('/challans')
    setRows(res.data)
  }

  async function search() {
    const res = await api.get('/challans', { params: { from, to } })
    setRows(res.data)
  }

  function openPdf(row: any) {
    if (row.pdf_path) window.open(`/files/${row.pdf_path}`, '_blank')
  }

  async function startEdit(row: any) {
    const res = await api.get(`/challans/${row.id}`)
    const { challan, items } = res.data
    setEditing({ id: challan.id, challan_no: challan.challan_no, date: challan.date, customer_id: challan.customer_id, shift_id: challan.shift_id })
    setItems(items.map((it: any) => ({
      metallic_id: it.metallic_id,
      cut_id: it.cut_id,
      operator_id: it.operator_id,
      helper_id: it.helper_id,
      bob_type_id: it.bob_type_id,
      box_type_id: it.box_type_id,
      bob_qty: Number(it.bob_qty),
      gross_wt: Number(it.gross_wt),
    })))

    // load masters if not yet
    if (customers.length === 0) setCustomers(await getOptions('customers'))
    if (shifts.length === 0) setShifts(await getOptions('shifts'))
    if (metallics.length === 0) setMetallics(await getOptions('metallics'))
    if (cuts.length === 0) setCuts(await getOptions('cuts'))
    if (employees.length === 0) setEmployees(await getOptions('employees'))
    if (bobTypes.length === 0) setBobTypes(await getOptions('bob_types'))
    if (boxTypes.length === 0) setBoxTypes(await getOptions('box_types'))
  }

  function weightOf(opts: Option[], id: number) { return opts.find(o => o.id === id)?.weight_kg || 0 }
  function nameOf(opts: Option[], id: number) { return opts.find(o => o.id === id)?.name || '' }

  function addRow() {
    setItems([...items, { metallic_id: 0, cut_id: 0, operator_id: 0, helper_id: null, bob_type_id: 0, box_type_id: 0, bob_qty: 0, gross_wt: 0 }])
  }

  function removeRow(index: number) {
    const next = [...items]
    next.splice(index, 1)
    setItems(next)
  }

  async function saveEdit() {
    if (!editing) return
    const payload = { date: editing.date, customer_id: editing.customer_id, shift_id: editing.shift_id, items }
    const res = await api.put(`/challans/${editing.id}`, payload)
    if (res.data.pdf_path) window.open(`/files/${res.data.pdf_path}`, '_blank')
    setEditing(null)
    setItems([])
    await load()
  }

  async function softDelete(row: any) {
    const reason = window.prompt('Reason for delete?') || ''
    await api.delete(`/challans/${row.id}`, { params: { reason } })
    await load()
  }

  if (editing) {
    return (
      <div>
        <h4>Edit Challan #{String(editing.challan_no).padStart(6, '0')}</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 8 }}>
          <label>Date<input type="date" value={editing.date} onChange={e => setEditing({ ...editing, date: e.target.value })} /></label>
          <label>Customer<select value={editing.customer_id} onChange={e => setEditing({ ...editing, customer_id: Number(e.target.value) })}><option value="">Select</option>{customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
          <label>Shift<select value={editing.shift_id} onChange={e => setEditing({ ...editing, shift_id: Number(e.target.value) })}><option value="">Select</option>{shifts.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
        </div>

        <div style={{ marginTop: 12 }}>
          <button onClick={addRow}>+ Add Item</button>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 8 }}>
          <thead>
            <tr>
              <th>#</th>
              <th>Metallic</th>
              <th>Cut</th>
              <th>Operator</th>
              <th>Helper</th>
              <th>Bob</th>
              <th>Box</th>
              <th>Qty</th>
              <th>Gross</th>
              <th>Tare</th>
              <th>Net</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {items.map((it, i) => {
              const bobWt = weightOf(bobTypes, it.bob_type_id)
              const boxWt = weightOf(boxTypes, it.box_type_id)
              const tare = it.bob_qty * bobWt + boxWt
              const net = it.gross_wt - tare
              return (
                <tr key={i}>
                  <td>{i+1}</td>
                  <td><select value={it.metallic_id} onChange={e => { const v = Number(e.target.value); const n=[...items]; n[i]={...it, metallic_id:v}; setItems(n) }}><option value={0}>Select</option>{metallics.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}</select></td>
                  <td><select value={it.cut_id} onChange={e => { const v = Number(e.target.value); const n=[...items]; n[i]={...it, cut_id:v}; setItems(n) }}><option value={0}>Select</option>{cuts.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}</select></td>
                  <td><select value={it.operator_id} onChange={e => { const v = Number(e.target.value); const n=[...items]; n[i]={...it, operator_id:v}; setItems(n) }}><option value={0}>Select</option>{employees.filter(e => e.role_operator).map(m => <option key={m.id} value={m.id}>{m.name}</option>)}</select></td>
                  <td><select value={it.helper_id ?? ''} onChange={e => { const v = e.target.value ? Number(e.target.value) : null; const n=[...items]; n[i]={...it, helper_id:v}; setItems(n) }}><option value="">None</option>{employees.filter(e => e.role_helper).map(m => <option key={m.id} value={m.id}>{m.name}</option>)}</select></td>
                  <td><select value={it.bob_type_id} onChange={e => { const v = Number(e.target.value); const n=[...items]; n[i]={...it, bob_type_id:v}; setItems(n) }}><option value={0}>Select</option>{bobTypes.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}</select></td>
                  <td><select value={it.box_type_id} onChange={e => { const v = Number(e.target.value); const n=[...items]; n[i]={...it, box_type_id:v}; setItems(n) }}><option value={0}>Select</option>{boxTypes.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}</select></td>
                  <td><input type="number" value={it.bob_qty} onChange={e => { const v = Number(e.target.value); const n=[...items]; n[i]={...it, bob_qty:v}; setItems(n) }} /></td>
                  <td><input type="number" step="0.001" value={it.gross_wt} onChange={e => { const v = Number(e.target.value); const n=[...items]; n[i]={...it, gross_wt:v}; setItems(n) }} /></td>
                  <td>{tare.toFixed(3)}</td>
                  <td>{net.toFixed(3)}</td>
                  <td><button onClick={() => removeRow(i)}>Remove</button></td>
                </tr>
              )
            })}
          </tbody>
        </table>

        <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
          <button onClick={saveEdit}>Save Changes</button>
          <button onClick={() => { setEditing(null); setItems([]) }}>Cancel</button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <label>From<input type="date" value={from} onChange={e => setFrom(e.target.value)} /></label>
        <label>To<input type="date" value={to} onChange={e => setTo(e.target.value)} /></label>
        <button onClick={search}>Search</button>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 12 }}>
        <thead><tr><th>ID</th><th>Challan No</th><th>Date</th><th>Actions</th></tr></thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.id}>
              <td>{r.id}</td>
              <td>{String(r.challan_no).padStart(6, '0')}</td>
              <td>{dayjs(r.date).format('DD/MM/YYYY')}</td>
              <td style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => openPdf(r)}>Open PDF</button>
                <button onClick={() => startEdit(r)}>Edit</button>
                <button onClick={() => softDelete(r)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
