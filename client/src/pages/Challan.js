import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import { api, getOptions } from '../api';
function Label({ idx, barcode, metallic, cut, bobType, boxType, bobQty, gross, tare, net }) {
    return (_jsxs("div", { style: { width: '125mm', height: '75mm', border: '1px solid #000', padding: '6mm', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }, children: [_jsxs("div", { children: [_jsxs("div", { style: { fontSize: 18, fontWeight: 700 }, children: ["Label #", String(idx).padStart(2, '0')] }), _jsxs("div", { children: ["Barcode: ", barcode] }), _jsxs("div", { children: ["Metallic: ", metallic, " | Cut: ", cut] }), _jsxs("div", { children: ["Bob: ", bobType, " | Box: ", boxType] }), _jsxs("div", { children: ["Qty: ", bobQty] })] }), _jsxs("div", { style: { fontSize: 14 }, children: [_jsxs("div", { children: ["Gross: ", gross.toFixed(3), " kg"] }), _jsxs("div", { children: ["Tare: ", tare.toFixed(3), " kg"] }), _jsxs("div", { children: ["Net: ", net.toFixed(3), " kg"] })] })] }));
}
export function ChallanPage() {
    const [date, setDate] = useState(dayjs().format('YYYY-MM-DD'));
    const [reservedChallanNo, setReservedChallanNo] = useState(null);
    const [customers, setCustomers] = useState([]);
    const [shifts, setShifts] = useState([]);
    const [metallics, setMetallics] = useState([]);
    const [cuts, setCuts] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [bobTypes, setBobTypes] = useState([]);
    const [boxTypes, setBoxTypes] = useState([]);
    const [customerId, setCustomerId] = useState('');
    const [shiftId, setShiftId] = useState('');
    const [form, setForm] = useState({ metallic_id: 0, cut_id: 0, operator_id: 0, helper_id: null, bob_type_id: 0, box_type_id: 0, bob_qty: 0, gross_wt: 0 });
    const [basket, setBasket] = useState([]);
    useEffect(() => {
        (async () => {
            setCustomers(await getOptions('customers'));
            setShifts(await getOptions('shifts'));
            setMetallics(await getOptions('metallics'));
            setCuts(await getOptions('cuts'));
            setEmployees(await getOptions('employees'));
            setBobTypes(await getOptions('bob_types'));
            setBoxTypes(await getOptions('box_types'));
            // reserve a challan number for barcode labels
            try {
                const res = await api.post('/challans/reserve-number');
                setReservedChallanNo(res.data.challan_no);
            }
            catch { }
        })();
    }, []);
    function weightOf(opts, id) { return opts.find(o => o.id === id)?.weight_kg || 0; }
    function nameOf(opts, id) { return opts.find(o => o.id === id)?.name || ''; }
    const tare = useMemo(() => {
        const bobWt = weightOf(bobTypes, form.bob_type_id);
        const boxWt = weightOf(boxTypes, form.box_type_id);
        return form.bob_qty * bobWt + boxWt;
    }, [form, bobTypes, boxTypes]);
    const net = useMemo(() => form.gross_wt - tare, [form.gross_wt, tare]);
    function buildBarcode(idx) {
        const yy = dayjs(date).format('YY');
        const ch = reservedChallanNo != null ? String(reservedChallanNo).padStart(6, '0') : '000000';
        return `CH-${yy}-${ch}-${String(idx).padStart(2, '0')}`;
    }
    function printLabel(idx, item) {
        const w = window.open('', '_blank', 'width=400,height=300');
        const metallic = nameOf(metallics, item.metallic_id);
        const cut = nameOf(cuts, item.cut_id);
        const bobType = nameOf(bobTypes, item.bob_type_id);
        const boxType = nameOf(boxTypes, item.box_type_id);
        const bobWt = weightOf(bobTypes, item.bob_type_id);
        const boxWt = weightOf(boxTypes, item.box_type_id);
        const tare = item.bob_qty * bobWt + boxWt;
        const net = item.gross_wt - tare;
        const barcode = buildBarcode(idx);
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
    </body></html>`);
        w.document.close();
    }
    function addToBasket() {
        setBasket([...basket, form]);
        printLabel(basket.length + 1, form);
    }
    async function generateChallan() {
        if (!customerId || !shiftId || basket.length === 0)
            return alert('Fill header and add items');
        const payload = { date, customer_id: Number(customerId), shift_id: Number(shiftId), items: basket };
        if (reservedChallanNo != null)
            payload.challan_no = reservedChallanNo;
        const res = await api.post('/challans', payload);
        const pdfPath = res.data.pdf_path;
        window.open(`/files/${pdfPath}`, '_blank');
        setBasket([]);
    }
    const disableWeights = true;
    return (_jsxs("div", { children: [_jsxs("div", { style: { display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 8 }, children: [_jsxs("label", { children: ["Date", _jsx("input", { type: "date", value: date, onChange: e => setDate(e.target.value) })] }), _jsxs("label", { children: ["Customer", _jsxs("select", { value: customerId, onChange: e => setCustomerId(Number(e.target.value)), children: [_jsx("option", { value: "", children: "Select" }), customers.map(c => _jsx("option", { value: c.id, children: c.name }, c.id))] })] }), _jsxs("label", { children: ["Shift", _jsxs("select", { value: shiftId, onChange: e => setShiftId(Number(e.target.value)), children: [_jsx("option", { value: "", children: "Select" }), shifts.map(s => _jsx("option", { value: s.id, children: s.name }, s.id))] })] })] }), _jsx("hr", { style: { margin: '12px 0' } }), _jsxs("div", { style: { display: 'grid', gridTemplateColumns: 'repeat(6, minmax(0, 1fr))', gap: 8, alignItems: 'end' }, children: [_jsxs("label", { children: ["Metallic", _jsxs("select", { value: form.metallic_id, onChange: e => setForm({ ...form, metallic_id: Number(e.target.value) }), children: [_jsx("option", { value: 0, children: "Select" }), metallics.map(m => _jsx("option", { value: m.id, children: m.name }, m.id))] })] }), _jsxs("label", { children: ["Cut", _jsxs("select", { value: form.cut_id, onChange: e => setForm({ ...form, cut_id: Number(e.target.value) }), children: [_jsx("option", { value: 0, children: "Select" }), cuts.map(m => _jsx("option", { value: m.id, children: m.name }, m.id))] })] }), _jsxs("label", { children: ["Operator", _jsxs("select", { value: form.operator_id, onChange: e => setForm({ ...form, operator_id: Number(e.target.value) }), children: [_jsx("option", { value: 0, children: "Select" }), employees.filter(e => e.role_operator).map(m => _jsx("option", { value: m.id, children: m.name }, m.id))] })] }), _jsxs("label", { children: ["Helper", _jsxs("select", { value: form.helper_id ?? '', onChange: e => setForm({ ...form, helper_id: e.target.value ? Number(e.target.value) : null }), children: [_jsx("option", { value: "", children: "None" }), employees.filter(e => e.role_helper).map(m => _jsx("option", { value: m.id, children: m.name }, m.id))] })] }), _jsxs("label", { children: ["Bob Type", _jsxs("select", { value: form.bob_type_id, onChange: e => setForm({ ...form, bob_type_id: Number(e.target.value) }), children: [_jsx("option", { value: 0, children: "Select" }), bobTypes.map(m => _jsx("option", { value: m.id, children: m.name }, m.id))] })] }), _jsxs("label", { children: ["Box Type", _jsxs("select", { value: form.box_type_id, onChange: e => setForm({ ...form, box_type_id: Number(e.target.value) }), children: [_jsx("option", { value: 0, children: "Select" }), boxTypes.map(m => _jsx("option", { value: m.id, children: m.name }, m.id))] })] }), _jsxs("label", { children: ["Bob QTY", _jsx("input", { type: "number", value: form.bob_qty, onChange: e => setForm({ ...form, bob_qty: Number(e.target.value) }) })] }), _jsxs("label", { children: ["Gross WT (kg)", _jsx("input", { type: "number", step: "0.001", value: form.gross_wt, onChange: e => setForm({ ...form, gross_wt: Number(e.target.value) }) })] }), _jsxs("label", { children: ["Tare WT (kg)", _jsx("input", { type: "number", step: "0.001", value: tare.toFixed(3), readOnly: true, disabled: disableWeights })] }), _jsxs("label", { children: ["Net WT (kg)", _jsx("input", { type: "number", step: "0.001", value: net.toFixed(3), readOnly: true, disabled: disableWeights })] }), _jsx("button", { onClick: addToBasket, children: "Add" })] }), _jsxs("div", { style: { marginTop: 12 }, children: [_jsx("h4", { children: "Basket" }), _jsxs("table", { style: { width: '100%', borderCollapse: 'collapse' }, children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "#" }), _jsx("th", { children: "Metallic" }), _jsx("th", { children: "Cut" }), _jsx("th", { children: "Bob" }), _jsx("th", { children: "Box" }), _jsx("th", { children: "Qty" }), _jsx("th", { children: "Gross" }), _jsx("th", { children: "Tare" }), _jsx("th", { children: "Net" })] }) }), _jsx("tbody", { children: basket.map((b, i) => {
                                    const bobWt = weightOf(bobTypes, b.bob_type_id);
                                    const boxWt = weightOf(boxTypes, b.box_type_id);
                                    const tare = b.bob_qty * bobWt + boxWt;
                                    const net = b.gross_wt - tare;
                                    return (_jsxs("tr", { children: [_jsx("td", { children: i + 1 }), _jsx("td", { children: nameOf(metallics, b.metallic_id) }), _jsx("td", { children: nameOf(cuts, b.cut_id) }), _jsx("td", { children: nameOf(bobTypes, b.bob_type_id) }), _jsx("td", { children: nameOf(boxTypes, b.box_type_id) }), _jsx("td", { children: b.bob_qty }), _jsx("td", { children: b.gross_wt.toFixed(3) }), _jsx("td", { children: tare.toFixed(3) }), _jsx("td", { children: net.toFixed(3) })] }, i));
                                }) })] })] }), _jsx("div", { style: { marginTop: 12 }, children: _jsx("button", { onClick: generateChallan, children: "Generate Challan" }) })] }));
}
