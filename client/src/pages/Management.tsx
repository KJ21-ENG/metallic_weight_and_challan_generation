import { useEffect, useState } from 'react'
import dayjs from 'dayjs'
import { api, getOptions } from '../api'
import { Button, Card, CardContent, Grid, Stack, TextField, Typography, TableContainer, Paper, Table, TableHead, TableRow, TableCell, TableBody, Select, MenuItem, FormControl, InputLabel } from '@mui/material'

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
    if (row.id) window.open(`/api/challans/${row.id}/print`, '_blank')
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

    if (customers.length === 0) setCustomers(await getOptions('customers'))
    if (shifts.length === 0) setShifts(await getOptions('shifts'))
    if (metallics.length === 0) setMetallics(await getOptions('metallics'))
    if (cuts.length === 0) setCuts(await getOptions('cuts'))
    if (employees.length === 0) setEmployees(await getOptions('employees'))
    if (bobTypes.length === 0) setBobTypes(await getOptions('bob_types'))
    if (boxTypes.length === 0) setBoxTypes(await getOptions('box_types'))
  }

  function weightOf(opts: Option[], id: number) { return Number(opts.find(o => o.id === id)?.weight_kg ?? 0) }
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
    if (res.data.pdf_path) window.open(`/api/challans/${editing.id}/print`, '_blank')
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
      <Stack spacing={2}>
        <Typography variant="h6">Edit Challan #{String(editing.challan_no).padStart(6, '0')}</Typography>
        <Card>
          <CardContent>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={3}><TextField fullWidth label="Date" type="date" value={editing.date} onChange={e => setEditing({ ...editing!, date: e.target.value })} InputLabelProps={{ shrink: true }} /></Grid>
              <Grid item xs={12} sm={5}>
                <FormControl fullWidth>
                  <InputLabel>Customer</InputLabel>
                  <Select label="Customer" value={editing.customer_id} onChange={e => setEditing({ ...editing!, customer_id: Number(e.target.value) })}>
                    {customers.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth>
                  <InputLabel>Shift</InputLabel>
                  <Select label="Shift" value={editing.shift_id} onChange={e => setEditing({ ...editing!, shift_id: Number(e.target.value) })}>
                    {shifts.map(s => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Button onClick={addRow}>+ Add Item</Button>
            <TableContainer component={Paper} sx={{ mt: 2 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>#</TableCell>
                    <TableCell>Metallic</TableCell>
                    <TableCell>Cut</TableCell>
                    <TableCell>Operator</TableCell>
                    <TableCell>Helper</TableCell>
                    <TableCell>Bob</TableCell>
                    <TableCell>Box</TableCell>
                    <TableCell align="right">Qty</TableCell>
                    <TableCell align="right">Gross</TableCell>
                    <TableCell align="right">Tare</TableCell>
                    <TableCell align="right">Net</TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {items.map((it, i) => {
                    const bobWt = weightOf(bobTypes, it.bob_type_id)
                    const boxWt = weightOf(boxTypes, it.box_type_id)
                    const tare = it.bob_qty * bobWt + boxWt
                    const net = it.gross_wt - tare
                    return (
                      <TableRow key={i}>
                        <TableCell>{i+1}</TableCell>
                        <TableCell>
                          <Select size="small" value={it.metallic_id} onChange={e => { const v = Number(e.target.value); const n=[...items]; n[i]={...it, metallic_id:v}; setItems(n) }}>
                            <MenuItem value={0}>Select</MenuItem>
                            {metallics.map(m => <MenuItem key={m.id} value={m.id}>{m.name}</MenuItem>)}
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Select size="small" value={it.cut_id} onChange={e => { const v = Number(e.target.value); const n=[...items]; n[i]={...it, cut_id:v}; setItems(n) }}>
                            <MenuItem value={0}>Select</MenuItem>
                            {cuts.map(m => <MenuItem key={m.id} value={m.id}>{m.name}</MenuItem>)}
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Select size="small" value={it.operator_id} onChange={e => { const v = Number(e.target.value); const n=[...items]; n[i]={...it, operator_id:v}; setItems(n) }}>
                            <MenuItem value={0}>Select</MenuItem>
                            {employees.filter(e => e.role_operator).map(m => <MenuItem key={m.id} value={m.id}>{m.name}</MenuItem>)}
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Select size="small" value={it.helper_id ?? ''} onChange={e => { const v = e.target.value ? Number(e.target.value) : null; const n=[...items]; n[i]={...it, helper_id:v}; setItems(n) }}>
                            <MenuItem value="">None</MenuItem>
                            {employees.filter(e => e.role_helper).map(m => <MenuItem key={m.id} value={m.id}>{m.name}</MenuItem>)}
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Select size="small" value={it.bob_type_id} onChange={e => { const v = Number(e.target.value); const n=[...items]; n[i]={...it, bob_type_id:v}; setItems(n) }}>
                            <MenuItem value={0}>Select</MenuItem>
                            {bobTypes.map(m => <MenuItem key={m.id} value={m.id}>{m.name}</MenuItem>)}
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Select size="small" value={it.box_type_id} onChange={e => { const v = Number(e.target.value); const n=[...items]; n[i]={...it, box_type_id:v}; setItems(n) }}>
                            <MenuItem value={0}>Select</MenuItem>
                            {boxTypes.map(m => <MenuItem key={m.id} value={m.id}>{m.name}</MenuItem>)}
                          </Select>
                        </TableCell>
                        <TableCell align="right"><TextField size="small" type="number" value={it.bob_qty} onChange={e => { const v = Number(e.target.value); const n=[...items]; n[i]={...it, bob_qty:v}; setItems(n) }} /></TableCell>
                        <TableCell align="right"><TextField size="small" type="number" inputProps={{ step: '0.001' }} value={it.gross_wt} onChange={e => { const v = Number(e.target.value); const n=[...items]; n[i]={...it, gross_wt:v}; setItems(n) }} /></TableCell>
                        <TableCell align="right">{tare.toFixed(3)}</TableCell>
                        <TableCell align="right">{net.toFixed(3)}</TableCell>
                        <TableCell align="right"><Button size="small" color="error" variant="outlined" onClick={() => removeRow(i)}>Remove</Button></TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </TableContainer>

            <Stack direction="row" justifyContent="flex-end" sx={{ mt: 2 }}>
              <Button onClick={saveEdit}>Save Changes & Print</Button>
              <Button variant="outlined" onClick={() => { setEditing(null); setItems([]) }}>Cancel</Button>
            </Stack>
          </CardContent>
        </Card>
      </Stack>
    )
  }

  return (
    <Stack spacing={2}>
      <Typography variant="h5">Challans</Typography>
      <Card>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={3}><TextField fullWidth label="From" type="date" value={from} onChange={e => setFrom(e.target.value)} InputLabelProps={{ shrink: true }} /></Grid>
            <Grid item xs={12} sm={3}><TextField fullWidth label="To" type="date" value={to} onChange={e => setTo(e.target.value)} InputLabelProps={{ shrink: true }} /></Grid>
            <Grid item xs={12} sm={'auto' as any}><Button onClick={search}>Search</Button></Grid>
          </Grid>
        </CardContent>
      </Card>

      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Challan No</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Customer</TableCell>
              <TableCell align="right">Total Bobbin</TableCell>
              <TableCell align="right">Total Net (kg)</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map(r => (
              <TableRow key={r.id}>
                <TableCell>{r.id}</TableCell>
                <TableCell>{String(r.challan_no).padStart(6, '0')}</TableCell>
                <TableCell>{dayjs(r.date).format('DD/MM/YYYY')}</TableCell>
                <TableCell>{r.customer_name}</TableCell>
                <TableCell align="right">{r.total_bob_qty}</TableCell>
                <TableCell align="right">{Number(r.total_net_wt).toFixed(3)}</TableCell>
                <TableCell align="right">
                  <Stack direction="row" spacing={1} justifyContent="flex-end">
                    <Button size="small" onClick={() => openPdf(r)}>Open PDF</Button>
                    <Button size="small" onClick={() => startEdit(r)}>Edit</Button>
                    <Button size="small" color="error" variant="outlined" onClick={() => softDelete(r)}>Delete</Button>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Stack>
  )
}
