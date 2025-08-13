import { useEffect, useState } from 'react'
import { api, getOptions } from '../api'
import { Alert, Box, Button, Card, CardContent, Chip, FormControl, Grid, InputLabel, MenuItem, Select, Stack, Tab, Tabs, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Paper, Checkbox } from '@mui/material'

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
    <Stack spacing={2}>
      <Tabs value={type} onChange={(_, v) => setType(v)}>
        {masterTabs.map(t => <Tab key={t.key} value={t.key} label={t.label} />)}
      </Tabs>

      <Card>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={3}><TextField fullWidth label="Name" value={name} onChange={e => setName(e.target.value)} /></Grid>
            {isWeighted && <Grid item xs={12} sm={2}><TextField fullWidth label="Weight (kg)" type="number" inputProps={{ step: '0.001' }} value={weight} onChange={e => setWeight(e.target.value)} /></Grid>}
            {isEmployees && (
              <Grid item xs={12} sm={3}>
                <FormControl component={Box} sx={{ display: 'flex', flexDirection: 'row', gap: 2 }}>
                  <label><Checkbox checked={roleOp} onChange={e => setRoleOp(e.target.checked)} /> Operator</label>
                  <label><Checkbox checked={roleHelp} onChange={e => setRoleHelp(e.target.checked)} /> Helper</label>
                </FormControl>
              </Grid>
            )}
            {isCustomers && (
              <>
                <Grid item xs={12} sm={4}><TextField fullWidth label="Address" value={address} onChange={e => setAddress(e.target.value)} /></Grid>
                <Grid item xs={12} sm={2}><TextField fullWidth label="GSTIN" value={gstin} onChange={e => setGstin(e.target.value)} /></Grid>
              </>
            )}
            <Grid item xs={12} sm={'auto' as any}><Button onClick={add}>+ New</Button></Grid>
          </Grid>
        </CardContent>
      </Card>

      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              {isWeighted && <TableCell align="right">Weight (kg)</TableCell>}
              {isEmployees && <><TableCell>Operator</TableCell><TableCell>Helper</TableCell></>}
              {isCustomers && <><TableCell>Address</TableCell><TableCell>GSTIN</TableCell></>}
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map(i => (
              <TableRow key={i.id}>
                <TableCell>
                  {editingId === i.id ? (
                    <TextField size="small" value={edit?.name || ''} onChange={e => setEdit({ ...(edit as Item), name: e.target.value })} />
                  ) : i.name}
                </TableCell>
                {isWeighted && (
                  <TableCell align="right">
                    {editingId === i.id ? (
                      <TextField size="small" type="number" inputProps={{ step: '0.001' }} value={edit?.weight_kg ?? 0} onChange={e => setEdit({ ...(edit as Item), weight_kg: Number(e.target.value) })} />
                    ) : (i.weight_kg?.toFixed?.(3))}
                  </TableCell>
                )}
                {isEmployees && (
                  <>
                    <TableCell>{editingId === i.id ? <Checkbox checked={!!edit?.role_operator} onChange={e => setEdit({ ...(edit as Item), role_operator: e.target.checked })} /> : (i.role_operator ? 'Yes' : 'No')}</TableCell>
                    <TableCell>{editingId === i.id ? <Checkbox checked={!!edit?.role_helper} onChange={e => setEdit({ ...(edit as Item), role_helper: e.target.checked })} /> : (i.role_helper ? 'Yes' : 'No')}</TableCell>
                  </>
                )}
                {isCustomers && (
                  <>
                    <TableCell>{editingId === i.id ? <TextField size="small" value={edit?.address || ''} onChange={e => setEdit({ ...(edit as Item), address: e.target.value })} /> : (i.address || '')}</TableCell>
                    <TableCell>{editingId === i.id ? <TextField size="small" value={edit?.gstin || ''} onChange={e => setEdit({ ...(edit as Item), gstin: e.target.value })} /> : (i.gstin || '')}</TableCell>
                  </>
                )}
                <TableCell align="right">
                  {editingId === i.id ? (
                    <Stack direction="row" justifyContent="flex-end" spacing={1}>
                      <Button size="small" onClick={() => saveEdit(i)}>Save</Button>
                      <Button size="small" variant="outlined" onClick={() => { setEditingId(null); setEdit(null) }}>Cancel</Button>
                    </Stack>
                  ) : (
                    <Stack direction="row" justifyContent="flex-end" spacing={1}>
                      <Button size="small" onClick={() => startEdit(i)}>Edit</Button>
                      <Button size="small" color="error" variant="outlined" onClick={() => remove(i.id)}>Delete</Button>
                    </Stack>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Stack>
  )
}
