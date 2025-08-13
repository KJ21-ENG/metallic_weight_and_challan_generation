import { useEffect, useMemo, useState } from 'react'
import dayjs from 'dayjs'
import { api, getOptions } from '../api'
import { Box, Button, Card, CardContent, Divider, FormControl, Grid, InputLabel, MenuItem, Select, Stack, TextField, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, Alert } from '@mui/material'

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
  const [reservedChallanNo, setReservedChallanNo] = useState<number | null>(null)

  const [customers, setCustomers] = useState<Option[]>([])
  const [shifts, setShifts] = useState<Option[]>([])
  const [metallics, setMetallics] = useState<Option[]>([])
  const [cuts, setCuts] = useState<Option[]>([])
  const [employees, setEmployees] = useState<Option[]>([])
  const [bobTypes, setBobTypes] = useState<Option[]>([])
  const [boxTypes, setBoxTypes] = useState<Option[]>([])

  const [customerId, setCustomerId] = useState<number | ''>('' as any)
  const [shiftId, setShiftId] = useState<number | ''>('' as any)

  const [form, setForm] = useState<BasketItem>({ metallic_id: 0, cut_id: 0, operator_id: 0, helper_id: null, bob_type_id: 0, box_type_id: 0, bob_qty: 0, gross_wt: 0 })
  const [basket, setBasket] = useState<BasketItem[]>([])

  useEffect(() => { (async () => {
    setCustomers(await getOptions('customers'))
    setShifts(await getOptions('shifts'))
    setMetallics(await getOptions('metallics'))
    setCuts(await getOptions('cuts'))
    setEmployees(await getOptions('employees'))
    setBobTypes(await getOptions('bob_types'))
    setBoxTypes(await getOptions('box_types'))
    try {
      const res = await api.post('/challans/reserve-number')
      setReservedChallanNo(res.data.challan_no)
    } catch {}
  })() }, [])

  function weightOf(opts: Option[], id: number) { return Number(opts.find(o => Number(o.id) === Number(id))?.weight_kg ?? 0) }
  const round3 = (n: number) => Math.round((Number.isFinite(n) ? n : 0) * 1000) / 1000
  function nameOf(opts: Option[], id: number) { return opts.find(o => Number(o.id) === Number(id))?.name || '' }

  const bobWt = useMemo(() => weightOf(bobTypes, form.bob_type_id), [JSON.stringify(bobTypes), form.bob_type_id])
  const boxWt = useMemo(() => weightOf(boxTypes, form.box_type_id), [JSON.stringify(boxTypes), form.box_type_id])
  const tare = useMemo(() => round3((Number(form.bob_qty) || 0) * bobWt + boxWt), [form.bob_qty, bobWt, boxWt])
  const net = useMemo(() => round3((Number(form.gross_wt) || 0) - tare), [form.gross_wt, tare])

  function buildBarcode(idx: number) {
    const yy = dayjs(date).format('YY')
    const ch = reservedChallanNo != null ? String(reservedChallanNo).padStart(6, '0') : '000000'
    return `CH-${yy}-${ch}-${String(idx).padStart(2, '0')}`
  }

  function printLabel(idx: number, item: BasketItem) {
    const w = window.open('', '_blank', 'width=500,height=400')!
    const metallic = nameOf(metallics, item.metallic_id)
    const cut = nameOf(cuts, item.cut_id)
    const bobType = nameOf(bobTypes, item.bob_type_id)
    const boxType = nameOf(boxTypes, item.box_type_id)
    const bobWt = weightOf(bobTypes, item.bob_type_id)
    const boxWt = weightOf(boxTypes, item.box_type_id)
    const tare = item.bob_qty * bobWt + boxWt
    const net = item.gross_wt - tare
    const barcode = buildBarcode(idx)

    w.document.write(`<!doctype html><html><head><meta charset=\"utf-8\"/>
    <script src=\"https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js\"></script>
    <style>
      @page { size: 125mm 75mm; margin: 0; }
      body { margin: 0; font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif; }
      .label { width: 125mm; height: 75mm; padding: 8mm; box-sizing: border-box; }
      .title { font-size: 18px; font-weight: 700; margin-bottom: 4mm; }
      .row { display: flex; gap: 6mm; margin-bottom: 2mm; }
      .kv { min-width: 40mm; }
      .muted { opacity: .8 }
      .weights { display: flex; gap: 8mm; font-size: 14px; margin-top: 4mm; }
      .barcode { margin-top: 2mm }
    </style></head><body>
      <div class="label">
        <div class="title">Box Label</div>
        <svg id="barcode" class="barcode"></svg>
        <div class="row"><div class="kv"><b>Metallic</b></div><div>${metallic}</div></div>
        <div class="row"><div class="kv"><b>Cut</b></div><div>${cut}</div></div>
        <div class="row"><div class="kv"><b>Bob/Box</b></div><div>${bobType} / ${boxType}</div></div>
        <div class="row"><div class="kv"><b>Bob Qty</b></div><div>${item.bob_qty}</div></div>
        <div class="weights">
          <div>Gross: <b>${item.gross_wt.toFixed(3)}</b> kg</div>
          <div>Tare: <b>${tare.toFixed(3)}</b> kg</div>
          <div>Net: <b>${net.toFixed(3)}</b> kg</div>
        </div>
        <div class="muted" style="margin-top:4mm">Auto-printed on add</div>
      </div>
      <script>
        window.onload = function(){
          try { JsBarcode('#barcode', '${barcode}', {format: 'code128', width: 2, height: 60, displayValue: true, fontSize: 12}); } catch(e) {}
          window.print(); setTimeout(() => window.close(), 250);
        }
      <\/script>
    </body></html>`)
    w.document.close()
  }

  function addToBasket() {
    setBasket([...basket, form])
    printLabel(basket.length + 1, form)
  }

  function removeFromBasket(index: number) {
    const next = [...basket]
    next.splice(index, 1)
    setBasket(next)
  }

  async function generateChallan() {
    if (!customerId || !shiftId || basket.length === 0) return alert('Fill header and add items')
    const payload: any = { date, customer_id: Number(customerId), shift_id: Number(shiftId), items: basket }
    if (reservedChallanNo != null) payload.challan_no = reservedChallanNo
    const res = await api.post('/challans', payload)
    const id = res.data.challan.id as number
    window.open(`/api/challans/${id}/print`, '_blank')
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
            <Grid item xs={12} sm={5}>
              <FormControl fullWidth>
                <InputLabel>Customer</InputLabel>
                <Select label="Customer" value={customerId} onChange={e => setCustomerId(Number(e.target.value))}>
                  <MenuItem value=""><em>Select</em></MenuItem>
                  {customers.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth>
                <InputLabel>Shift</InputLabel>
                <Select label="Shift" value={shiftId} onChange={e => setShiftId(Number(e.target.value))}>
                  <MenuItem value=""><em>Select</em></MenuItem>
                  {shifts.map(s => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
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
                  {cuts.map(m => <MenuItem key={m.id} value={m.id}>{m.name}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth>
                <InputLabel>Operator</InputLabel>
                <Select label="Operator" value={form.operator_id} onChange={e => setForm({ ...form, operator_id: Number(e.target.value) })}>
                  <MenuItem value={0}><em>Select</em></MenuItem>
                  {employees.filter(e => e.role_operator).map(m => <MenuItem key={m.id} value={m.id}>{m.name}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth>
                <InputLabel>Helper</InputLabel>
                <Select label="Helper" value={form.helper_id ?? ''} onChange={e => setForm({ ...form, helper_id: e.target.value ? Number(e.target.value) : null })}>
                  <MenuItem value=""><em>None</em></MenuItem>
                  {employees.filter(e => e.role_helper).map(m => <MenuItem key={m.id} value={m.id}>{m.name}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={3}>
              <FormControl fullWidth>
                <InputLabel>Bob Type</InputLabel>
                <Select label="Bob Type" value={form.bob_type_id} onChange={e => setForm({ ...form, bob_type_id: Number(e.target.value) })}>
                  <MenuItem value={0}><em>Select</em></MenuItem>
                  {bobTypes.map(m => <MenuItem key={m.id} value={m.id}>{m.name} <Chip size="small" label={`${Number(m.weight_kg ?? 0).toFixed(3)} kg`} sx={{ ml: 1 }} /></MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth>
                <InputLabel>Box Type</InputLabel>
                <Select label="Box Type" value={form.box_type_id} onChange={e => setForm({ ...form, box_type_id: Number(e.target.value) })}>
                  <MenuItem value={0}><em>Select</em></MenuItem>
                  {boxTypes.map(m => <MenuItem key={m.id} value={m.id}>{m.name} <Chip size="small" label={`${Number(m.weight_kg ?? 0).toFixed(3)} kg`} sx={{ ml: 1 }} /></MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={2}><TextField fullWidth type="number" label="Bob Qty" value={form.bob_qty || ''} onChange={e => setForm({ ...form, bob_qty: parseInt(e.target.value || '0', 10) })} /></Grid>
            <Grid item xs={12} sm={2}><TextField fullWidth type="number" inputProps={{ step: '0.001' }} label="Gross (kg)" value={form.gross_wt || ''} onChange={e => setForm({ ...form, gross_wt: parseFloat(e.target.value || '0') })} /></Grid>
            <Grid item xs={12} sm={1}><TextField fullWidth type="text" inputProps={{ readOnly: true }} label="Tare (kg)" value={tare.toFixed(3)} /></Grid>
            <Grid item xs={12} sm={1}><TextField fullWidth type="text" inputProps={{ readOnly: true }} label="Net (kg)" value={net.toFixed(3)} /></Grid>
            <Grid item xs={12} sm={2}><Button fullWidth onClick={addToBasket}>Add & Print Label</Button></Grid>
          </Grid>
          <Alert severity="info" sx={{ mt: 2 }}>Barcode prefix: {reservedChallanNo ? `CH-${dayjs(date).format('YY')}-${String(reservedChallanNo).padStart(6,'0')}-XX` : 'reserving…'}</Alert>
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
              </TableBody>
            </Table>
          </TableContainer>

          <Stack direction="row" justifyContent="flex-end" sx={{ mt: 2 }}>
            <Button size="large" onClick={generateChallan} disabled={!customerId || !shiftId || basket.length===0}>Generate Challan & Print</Button>
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  )
}
