import { useEffect, useMemo, useState } from 'react'
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

function Label({ idx, barcode, metallic, cut, bobType, boxType, bobQty, gross, tare, net }: any) {
  return (
    <div style={{ width: '125mm', height: '75mm', border: '1px solid #000', padding: '6mm', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      <div>
        <div style={{ fontSize: 18, fontWeight: 700 }}>Label #{String(idx).padStart(2, '0')}</div>
        <div>Barcode: {barcode}</div>
        <div>Metallic: {metallic} | Cut: {cut}</div>
        <div>Bob: {bobType} | Box: {boxType}</div>
        <div>Qty: {bobQty}</div>
      </div>
      <div style={{ fontSize: 14 }}>
        <div>Gross: {gross.toFixed(3)} kg</div>
        <div>Tare: {tare.toFixed(3)} kg</div>
        <div>Net: {net.toFixed(3)} kg</div>
      </div>
    </div>
  )
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
    // reserve a challan number for barcode labels
    try {
      const res = await api.post('/challans/reserve-number')
      setReservedChallanNo(res.data.challan_no)
    } catch {}
  })() }, [])

  function weightOf(opts: Option[], id: number) { return opts.find(o => o.id === id)?.weight_kg || 0 }
  function nameOf(opts: Option[], id: number) { return opts.find(o => o.id === id)?.name || '' }

  const tare = useMemo(() => {
    const bobWt = weightOf(bobTypes, form.bob_type_id)
    const boxWt = weightOf(boxTypes, form.box_type_id)
    return form.bob_qty * bobWt + boxWt
  }, [form, bobTypes, boxTypes])

  const net = useMemo(() => form.gross_wt - tare, [form.gross_wt, tare])

  function buildBarcode(idx: number) {
    const yy = dayjs(date).format('YY')
    const ch = reservedChallanNo != null ? String(reservedChallanNo).padStart(6, '0') : '000000'
    return `CH-${yy}-${ch}-${String(idx).padStart(2, '0')}`
  }

  function printLabel(idx: number, item: BasketItem) {
    const w = window.open('', '_blank', 'width=400,height=300')!
    const metallic = nameOf(metallics, item.metallic_id)
    const cut = nameOf(cuts, item.cut_id)
    const bobType = nameOf(bobTypes, item.bob_type_id)
    const boxType = nameOf(boxTypes, item.box_type_id)
    const bobWt = weightOf(bobTypes, item.bob_type_id)
    const boxWt = weightOf(boxTypes, item.box_type_id)
    const tare = item.bob_qty * bobWt + boxWt
    const net = item.gross_wt - tare
    const barcode = buildBarcode(idx)

    w.document.write(`<!doctype html><html><head><meta charset=\"utf-8\"/><style>
      @page { size: 125mm 75mm; margin: 0; }
      body { margin: 0; }
      .label { width: 125mm; height: 75mm; padding: 6mm; box-sizing: border-box; font-family: system-ui, sans-serif; }
      .row { display: flex; justify-content: space-between; }
      .title { font-size: 18px; font-weight: 700; }
    </style></head><body>
      <div class="label">
        <div class="title">Label #${String(idx).padStart(2, '0')}</div>
        <div>Barcode: ${barcode}</div>
        <div>Metallic: ${metallic} | Cut: ${cut}</div>
        <div>Bob: ${bobType} | Box: ${boxType}</div>
        <div>Qty: ${item.bob_qty}</div>
        <div class="row"><div>Gross: ${item.gross_wt.toFixed(3)} kg</div><div>Tare: ${tare.toFixed(3)} kg</div><div>Net: ${net.toFixed(3)} kg</div></div>
      </div>
      <script>window.onload = () => { window.print(); setTimeout(() => window.close(), 200); }<\/script>
    </body></html>`)
    w.document.close()
  }

  function addToBasket() {
    setBasket([...basket, form])
    printLabel(basket.length + 1, form)
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
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 8 }}>
        <label>Date<input type="date" value={date} onChange={e => setDate(e.target.value)} /></label>
        <label>Customer<select value={customerId} onChange={e => setCustomerId(Number(e.target.value))}><option value="">Select</option>{customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
        <label>Shift<select value={shiftId} onChange={e => setShiftId(Number(e.target.value))}><option value="">Select</option>{shifts.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
      </div>
      <hr style={{ margin: '12px 0' }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, minmax(0, 1fr))', gap: 8, alignItems: 'end' }}>
        <label>Metallic<select value={form.metallic_id} onChange={e => setForm({ ...form, metallic_id: Number(e.target.value) })}><option value={0}>Select</option>{metallics.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}</select></label>
        <label>Cut<select value={form.cut_id} onChange={e => setForm({ ...form, cut_id: Number(e.target.value) })}><option value={0}>Select</option>{cuts.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}</select></label>
        <label>Operator<select value={form.operator_id} onChange={e => setForm({ ...form, operator_id: Number(e.target.value) })}><option value={0}>Select</option>{employees.filter(e => e.role_operator).map(m => <option key={m.id} value={m.id}>{m.name}</option>)}</select></label>
        <label>Helper<select value={form.helper_id ?? ''} onChange={e => setForm({ ...form, helper_id: e.target.value ? Number(e.target.value) : null })}><option value="">None</option>{employees.filter(e => e.role_helper).map(m => <option key={m.id} value={m.id}>{m.name}</option>)}</select></label>
        <label>Bob Type<select value={form.bob_type_id} onChange={e => setForm({ ...form, bob_type_id: Number(e.target.value) })}><option value={0}>Select</option>{bobTypes.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}</select></label>
        <label>Box Type<select value={form.box_type_id} onChange={e => setForm({ ...form, box_type_id: Number(e.target.value) })}><option value={0}>Select</option>{boxTypes.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}</select></label>
        <label>Bob QTY<input type="number" value={form.bob_qty} onChange={e => setForm({ ...form, bob_qty: Number(e.target.value) })} /></label>
        <label>Gross WT (kg)<input type="number" step="0.001" value={form.gross_wt} onChange={e => setForm({ ...form, gross_wt: Number(e.target.value) })} /></label>
        <label>Tare WT (kg)<input type="number" step="0.001" value={tare.toFixed(3)} readOnly disabled={disableWeights} /></label>
        <label>Net WT (kg)<input type="number" step="0.001" value={net.toFixed(3)} readOnly disabled={disableWeights} /></label>
        <button onClick={addToBasket}>Add</button>
      </div>

      <div style={{ marginTop: 12 }}>
        <h4>Basket</h4>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr><th>#</th><th>Metallic</th><th>Cut</th><th>Bob</th><th>Box</th><th>Qty</th><th>Gross</th><th>Tare</th><th>Net</th></tr>
          </thead>
          <tbody>
            {basket.map((b, i) => {
              const bobWt = weightOf(bobTypes, b.bob_type_id)
              const boxWt = weightOf(boxTypes, b.box_type_id)
              const tare = b.bob_qty * bobWt + boxWt
              const net = b.gross_wt - tare
              return (
                <tr key={i}>
                  <td>{i+1}</td>
                  <td>{nameOf(metallics, b.metallic_id)}</td>
                  <td>{nameOf(cuts, b.cut_id)}</td>
                  <td>{nameOf(bobTypes, b.bob_type_id)}</td>
                  <td>{nameOf(boxTypes, b.box_type_id)}</td>
                  <td>{b.bob_qty}</td>
                  <td>{b.gross_wt.toFixed(3)}</td>
                  <td>{tare.toFixed(3)}</td>
                  <td>{net.toFixed(3)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: 12 }}>
        <button onClick={generateChallan}>Generate Challan</button>
      </div>
    </div>
  )
}
