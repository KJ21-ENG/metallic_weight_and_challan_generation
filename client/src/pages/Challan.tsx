import { useEffect, useMemo, useState } from 'react'
import dayjs from 'dayjs'
import { api, getOptions } from '../api'
import { Box, Button, Card, CardContent, FormControl, Grid, InputLabel, MenuItem, Select, Stack, TextField, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material'

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

export function ChallanPage() {
  const [date, setDate] = useState(dayjs().format('YYYY-MM-DD'))

  const [customers, setCustomers] = useState<Option[]>([])
  const [firms, setFirms] = useState<any[]>([])
  const [shifts, setShifts] = useState<Option[]>([])
  const [metallics, setMetallics] = useState<Option[]>([])
  const [cuts, setCuts] = useState<Option[]>([])
  const [employees, setEmployees] = useState<Option[]>([])
  const [bobTypes, setBobTypes] = useState<Option[]>([])
  const [boxTypes, setBoxTypes] = useState<Option[]>([])

  const [customerId, setCustomerId] = useState<number | ''>('' as any)
  const [shiftId, setShiftId] = useState<number | ''>('' as any)
  const [firmId, setFirmId] = useState<number | ''>('' as any)

  const [form, setForm] = useState<BasketItem>({ metallic_id: 0, cut_id: 0, operator_id: 0, helper_id: null, bob_type_id: 0, box_type_id: 0, bob_qty: 0, gross_wt: 0 })
  const [basket, setBasket] = useState<BasketItem[]>([])

  useEffect(() => { (async () => {
    const [c, s, m, cu, e, bt, bx, f] = await Promise.all([
      getOptions('customers'),
      getOptions('shifts'),
      getOptions('metallics'),
      getOptions('cuts'),
      getOptions('employees'),
      getOptions('bob_types'),
      getOptions('box_types'),
      getOptions('firms'),
    ])
    setCustomers(c); setShifts(s); setMetallics(m); setCuts(cu); setEmployees(e); setBobTypes(bt); setBoxTypes(bx); setFirms(f)
    // Auto-select first customer and shift if not chosen
    if (!customerId && c.length) setCustomerId(c[0].id)
    if (!shiftId && s.length) setShiftId(s[0].id)
    if (!firmId && f.length) setFirmId(f[0].id)
    // Do not reserve challan number on load; final challan_no will be assigned on save.
  })() }, [])

  function weightOf(opts: Option[], id: number) { return Number(opts.find(o => Number(o.id) === Number(id))?.weight_kg ?? 0) }
  const round3 = (n: number) => Math.round((Number.isFinite(n) ? n : 0) * 1000) / 1000
  function nameOf(opts: Option[], id: number) { return opts.find(o => Number(o.id) === Number(id))?.name || '' }

  const bobWt = useMemo(() => weightOf(bobTypes, form.bob_type_id), [JSON.stringify(bobTypes), form.bob_type_id])
  const boxWt = useMemo(() => weightOf(boxTypes, form.box_type_id), [JSON.stringify(boxTypes), form.box_type_id])
  const tare = useMemo(() => round3((Number(form.bob_qty) || 0) * bobWt + boxWt), [form.bob_qty, bobWt, boxWt])
  const net = useMemo(() => round3((Number(form.gross_wt) || 0) - tare), [form.gross_wt, tare])

  function addToBasket() {
    setBasket([...basket, form])
    // Reset form for next entry
    setForm({ metallic_id: 0, cut_id: 0, operator_id: 0, helper_id: null, bob_type_id: 0, box_type_id: 0, bob_qty: 0, gross_wt: 0 })
  }

  function removeFromBasket(index: number) {
    const next = [...basket]
    next.splice(index, 1)
    setBasket(next)
  }

  async function generateChallan() {
    if (!customerId || !shiftId || basket.length === 0) return alert('Fill header and add items')
    const payload: any = { date, customer_id: Number(customerId), shift_id: Number(shiftId), firm_id: firmId ? Number(firmId) : undefined, items: basket }
    const res = await api.post('/challans', payload)
    const id = res.data.challan.id as number
    alert(`Challan generated successfully! ID: ${id}`)
    setBasket([])
  }

  const disableWeights = true

  return (
    <Stack spacing={2}>
      <Typography variant="h5">Generate Challan</Typography>
      
      <Card>
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={3}><TextField fullWidth label="Date" type="date" value={date} onChange={e => setDate(e.target.value)} InputLabelProps={{ shrink: true }} /></Grid>
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth>
                <InputLabel>Customer</InputLabel>
                <Select label="Customer" value={customerId} onChange={e => setCustomerId(Number(e.target.value))}>
                  <MenuItem value=""><em>Select</em></MenuItem>
                  {customers.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth>
                <InputLabel>Shift</InputLabel>
                <Select label="Shift" value={shiftId} onChange={e => setShiftId(Number(e.target.value))}>
                  <MenuItem value=""><em>Select</em></MenuItem>
                  {shifts.map(s => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth>
                <InputLabel>Firm</InputLabel>
                <Select label="Firm" value={firmId} onChange={e => setFirmId(Number(e.target.value))}>
                  <MenuItem value=""><em>Select</em></MenuItem>
                  {firms.map((f: any) => <MenuItem key={f.id} value={f.id}>{f.name}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth>
                <InputLabel>Metallic</InputLabel>
                <Select label="Metallic" value={form.metallic_id} onChange={e => setForm({ ...form, metallic_id: Number(e.target.value) })}>
                  <MenuItem value={0}><em>Select</em></MenuItem>
                  {metallics.map(m => <MenuItem key={m.id} value={m.id}>{m.name}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth>
                <InputLabel>Cut</InputLabel>
                <Select label="Cut" value={form.cut_id} onChange={e => setForm({ ...form, cut_id: Number(e.target.value) })}>
                  <MenuItem value={0}><em>Select</em></MenuItem>
                  {cuts.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth>
                <InputLabel>Operator</InputLabel>
                <Select label="Operator" value={form.operator_id} onChange={e => setForm({ ...form, operator_id: Number(e.target.value) })}>
                  <MenuItem value={0}><em>Select</em></MenuItem>
                  {employees.filter(e => e.role_operator).map(e => <MenuItem key={e.id} value={e.id}>{e.name}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth>
                <InputLabel>Helper</InputLabel>
                <Select label="Helper" value={form.helper_id || ''} onChange={e => setForm({ ...form, helper_id: e.target.value ? Number(e.target.value) : null })}>
                  <MenuItem value=""><em>None</em></MenuItem>
                  {employees.filter(e => e.role_helper).map(e => <MenuItem key={e.id} value={e.id}>{e.name}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth>
                <InputLabel>Bob Type</InputLabel>
                <Select label="Bob Type" value={form.bob_type_id} onChange={e => setForm({ ...form, bob_type_id: Number(e.target.value) })}>
                  <MenuItem value={0}><em>Select</em></MenuItem>
                  {bobTypes.map(b => <MenuItem key={b.id} value={b.id}>{b.name} ({b.weight_kg} kg)</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth>
                <InputLabel>Box Type</InputLabel>
                <Select label="Box Type" value={form.box_type_id} onChange={e => setForm({ ...form, box_type_id: Number(e.target.value) })}>
                  <MenuItem value={0}><em>Select</em></MenuItem>
                  {boxTypes.map(b => <MenuItem key={b.id} value={b.id}>{b.name} ({b.weight_kg} kg)</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField fullWidth label="Bob Qty" type="number" value={form.bob_qty} onChange={e => setForm({ ...form, bob_qty: Number(e.target.value) })} inputProps={{ min: 0 }} />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField fullWidth label="Gross Weight (kg)" type="number" value={form.gross_wt} onChange={e => setForm({ ...form, gross_wt: Number(e.target.value) })} inputProps={{ min: 0, step: 0.001 }} />
            </Grid>
          </Grid>

          <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={3}>
                <Typography variant="body2" color="textSecondary">Bob Weight: {bobWt.toFixed(3)} kg</Typography>
              </Grid>
              <Grid item xs={12} sm={3}>
                <Typography variant="body2" color="textSecondary">Box Weight: {boxWt.toFixed(3)} kg</Typography>
              </Grid>
              <Grid item xs={12} sm={3}>
                <Typography variant="body2" color="textSecondary">Tare Weight: {tare.toFixed(3)} kg</Typography>
              </Grid>
              <Grid item xs={12} sm={3}>
                <Typography variant="body2" color="textSecondary">Net Weight: {net.toFixed(3)} kg</Typography>
              </Grid>
            </Grid>
          </Box>

          <Stack direction="row" justifyContent="flex-end" sx={{ mt: 2 }}>
            <Grid item xs={12} sm={2}><Button fullWidth onClick={addToBasket}>Add to Basket</Button></Grid>
          </Stack>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>Basket</Typography>
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>#</TableCell>
                  <TableCell>Metallic</TableCell>
                  <TableCell>Cut</TableCell>
                  <TableCell>Bob</TableCell>
                  <TableCell>Box</TableCell>
                  <TableCell align="right">Qty</TableCell>
                  <TableCell align="right">Gross</TableCell>
                  <TableCell align="right">Tare</TableCell>
                  <TableCell align="right">Net</TableCell>
                  <TableCell align="right"></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {basket.map((b, i) => {
                  const bobWt = weightOf(bobTypes, b.bob_type_id)
                  const boxWt = weightOf(boxTypes, b.box_type_id)
                  const t = round3((Number(b.bob_qty)||0) * bobWt + boxWt)
                  const n = round3((Number(b.gross_wt)||0) - t)
                  return (
                    <TableRow key={i}>
                      <TableCell>{i+1}</TableCell>
                      <TableCell>{nameOf(metallics, b.metallic_id)}</TableCell>
                      <TableCell>{nameOf(cuts, b.cut_id)}</TableCell>
                      <TableCell>{nameOf(bobTypes, b.bob_type_id)}</TableCell>
                      <TableCell>{nameOf(boxTypes, b.box_type_id)}</TableCell>
                      <TableCell align="right">{b.bob_qty}</TableCell>
                      <TableCell align="right">{b.gross_wt.toFixed(3)}</TableCell>
                      <TableCell align="right">{t.toFixed(3)}</TableCell>
                      <TableCell align="right">{n.toFixed(3)}</TableCell>
                  <TableCell align="right">
                    <Button size="small" color="error" variant="outlined" onClick={() => removeFromBasket(i)}>Remove</Button>
                  </TableCell>
                </TableRow>
                  )
                })}
                {basket.length > 0 && (() => {
                  const totals = basket.reduce((acc, b) => {
                    const bobWt = weightOf(bobTypes, b.bob_type_id)
                    const boxWt = weightOf(boxTypes, b.box_type_id)
                    const t = round3((Number(b.bob_qty)||0) * bobWt + boxWt)
                    const n = round3((Number(b.gross_wt)||0) - t)
                    acc.qty += Number(b.bob_qty)||0
                    acc.net += n
                    return acc
                  }, { qty: 0, net: 0 })
                  return (
                    <TableRow>
                      <TableCell colSpan={5}><b>Totals</b></TableCell>
                      <TableCell align="right"><b>{totals.qty}</b></TableCell>
                      <TableCell />
                      <TableCell />
                      <TableCell align="right"><b>{totals.net.toFixed(3)}</b></TableCell>
                      <TableCell />
                    </TableRow>
                  )
                })()}
              </TableBody>
            </Table>
          </TableContainer>

          <Stack direction="row" justifyContent="flex-end" sx={{ mt: 2 }}>
            <Button size="large" onClick={generateChallan} disabled={!customerId || !shiftId || basket.length===0}>Generate Challan</Button>
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  )
}
