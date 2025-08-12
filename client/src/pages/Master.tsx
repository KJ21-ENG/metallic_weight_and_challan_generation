import { useEffect, useState } from 'react'
import { api, getOptions } from '../api'

type Item = { id: number; name: string; weight_kg?: number; role_operator?: boolean; role_helper?: boolean; address?: string | null; gstin?: string | null }

const masterTabs = [
  { key: 'metallics', label: 'Metallic' },
  { key: 'cuts', label: 'Cut' },
  { key: 'employees', label: 'Employees' },
  { key: 'bob_types', label: 'Bob Type' },
  { key: 'box_types', label: 'Box Type' },
  { key: 'customers', label: 'Customers' },
  { key: 'shifts', label: 'Shifts' },
]

export function MasterPage() {
  const [type, setType] = useState('metallics')
  const [items, setItems] = useState<Item[]>([])

  const [name, setName] = useState('')
  const [weight, setWeight] = useState('')
  const [roleOp, setRoleOp] = useState(false)
  const [roleHelp, setRoleHelp] = useState(false)
  const [address, setAddress] = useState('')
  const [gstin, setGstin] = useState('')

  const [editingId, setEditingId] = useState<number | null>(null)
  const [edit, setEdit] = useState<Item | null>(null)

  const isWeighted = type === 'bob_types' || type === 'box_types'
  const isEmployees = type === 'employees'
  const isCustomers = type === 'customers'

  useEffect(() => { load(); resetForm() }, [type])

  function resetForm() {
    setName(''); setWeight(''); setRoleOp(false); setRoleHelp(false); setAddress(''); setGstin('')
    setEditingId(null); setEdit(null)
  }

  async function load() {
    const data = await getOptions(type)
    setItems(data)
  }

  async function add() {
    if (!name.trim()) return
    const body: any = { name: name.trim() }
    if (isWeighted) body.weight_kg = Number(weight || 0)
    if (isEmployees) { body.role_operator = roleOp; body.role_helper = roleHelp }
    if (isCustomers) { body.address = address || null; body.gstin = gstin || null }
    const res = await api.post(`/master/${type}`, body)
    resetForm()
    setItems([...items, res.data])
  }

  async function startEdit(i: Item) {
    setEditingId(i.id)
    setEdit({ ...i })
  }

  async function saveEdit(i: Item) {
    if (!edit) return
    const body: any = {}
    if (isWeighted) { body.name = edit.name; body.weight_kg = Number(edit.weight_kg || 0) }
    else if (isEmployees) { body.name = edit.name; body.role_operator = !!edit.role_operator; body.role_helper = !!edit.role_helper }
    else if (isCustomers) { body.name = edit.name; body.address = edit.address || null; body.gstin = edit.gstin || null }
    else { body.name = edit.name }
    const res = await api.put(`/master/${type}/${i.id}`, body)
    const updated = res.data
    setItems(items.map(it => it.id === i.id ? updated : it))
    setEditingId(null); setEdit(null)
  }

  async function remove(id: number) {
    const reason = window.prompt('Reason for delete?') || ''
    await api.delete(`/master/${type}/${id}`, { params: { reason } })
    setItems(items.filter(i => i.id !== id))
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
        {masterTabs.map(t => (
          <button key={t.key} onClick={() => setType(t.key)} style={{ padding: '6px 10px', background: type === t.key ? '#444' : '#eee', color: type === t.key ? '#fff' : '#000' }}>{t.label}</button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12, flexWrap: 'wrap' }}>
        <input placeholder="Name" value={name} onChange={e => setName(e.target.value)} />
        {isWeighted && (
          <input placeholder="Weight (kg)" type="number" step="0.001" value={weight} onChange={e => setWeight(e.target.value)} />
        )}
        {isEmployees && (
          <>
            <label><input type="checkbox" checked={roleOp} onChange={e => setRoleOp(e.target.checked)} /> Operator</label>
            <label><input type="checkbox" checked={roleHelp} onChange={e => setRoleHelp(e.target.checked)} /> Helper</label>
          </>
        )}
        {isCustomers && (
          <>
            <input placeholder="Address" value={address} onChange={e => setAddress(e.target.value)} style={{ minWidth: 200 }} />
            <input placeholder="GSTIN" value={gstin} onChange={e => setGstin(e.target.value)} />
          </>
        )}
        <button onClick={add}>+ New</button>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ textAlign: 'left' }}>Name</th>
            {isWeighted && <th style={{ textAlign: 'right' }}>Weight (kg)</th>}
            {isEmployees && <><th>Operator</th><th>Helper</th></>}
            {isCustomers && <><th>Address</th><th>GSTIN</th></>}
            <th></th>
          </tr>
        </thead>
        <tbody>
          {items.map(i => (
            <tr key={i.id}>
              <td>
                {editingId === i.id ? (
                  <input value={edit?.name || ''} onChange={e => setEdit({ ...(edit as Item), name: e.target.value })} />
                ) : (
                  i.name
                )}
              </td>

              {isWeighted && (
                <td style={{ textAlign: 'right' }}>
                  {editingId === i.id ? (
                    <input type="number" step="0.001" value={edit?.weight_kg ?? 0} onChange={e => setEdit({ ...(edit as Item), weight_kg: Number(e.target.value) })} />
                  ) : (
                    i.weight_kg?.toFixed?.(3)
                  )}
                </td>
              )}

              {isEmployees && (
                <>
                  <td style={{ textAlign: 'center' }}>
                    {editingId === i.id ? (
                      <input type="checkbox" checked={!!edit?.role_operator} onChange={e => setEdit({ ...(edit as Item), role_operator: e.target.checked })} />
                    ) : (
                      i.role_operator ? 'Yes' : 'No'
                    )}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    {editingId === i.id ? (
                      <input type="checkbox" checked={!!edit?.role_helper} onChange={e => setEdit({ ...(edit as Item), role_helper: e.target.checked })} />
                    ) : (
                      i.role_helper ? 'Yes' : 'No'
                    )}
                  </td>
                </>
              )}

              {isCustomers && (
                <>
                  <td>
                    {editingId === i.id ? (
                      <input value={edit?.address || ''} onChange={e => setEdit({ ...(edit as Item), address: e.target.value })} />
                    ) : (
                      i.address || ''
                    )}
                  </td>
                  <td>
                    {editingId === i.id ? (
                      <input value={edit?.gstin || ''} onChange={e => setEdit({ ...(edit as Item), gstin: e.target.value })} />
                    ) : (
                      i.gstin || ''
                    )}
                  </td>
                </>
              )}

              <td style={{ display: 'flex', gap: 6 }}>
                {editingId === i.id ? (
                  <>
                    <button onClick={() => saveEdit(i)}>Save</button>
                    <button onClick={() => { setEditingId(null); setEdit(null) }}>Cancel</button>
                  </>
                ) : (
                  <>
                    <button onClick={() => startEdit(i)}>Edit</button>
                    <button onClick={() => remove(i.id)}>Delete</button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
