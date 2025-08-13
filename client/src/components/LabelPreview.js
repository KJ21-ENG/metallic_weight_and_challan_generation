import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { forwardRef, useEffect } from 'react';
import JsBarcode from 'jsbarcode';
// Printable label 75mm x 125mm (portrait). We'll style in mm units so it matches printers.
export const LabelPreview = forwardRef(function LabelPreview(props, ref) {
    const { header = 'Label', dateText, color, cut, bobQty, gross, bobWeight, boxWeight, net, operator, helper, barcode } = props;
    useEffect(() => {
        try {
            const svg = document.getElementById('modal_barcode');
            if (svg)
                JsBarcode(svg, barcode, { format: 'code128', width: 2.2, height: 38, displayValue: false, margin: 0 });
        }
        catch { }
    }, [barcode]);
    return (_jsxs("div", { ref: ref, style: { width: '75mm', height: '125mm', border: '1.4mm solid #000', borderRadius: '6mm', padding: '2.5mm', boxSizing: 'border-box', fontFamily: 'Arial, Helvetica, sans-serif' }, children: [_jsx("div", { style: { fontSize: '8mm', fontWeight: 900, fontStyle: 'italic', textAlign: 'center', letterSpacing: '0.2mm', marginBottom: '1.5mm', textTransform: 'uppercase' }, children: header }), _jsxs("div", { style: { border: '0.7mm solid #000', borderRadius: '3mm', overflow: 'hidden' }, children: [row('DATE :', dateText), row('COLOR :', capitalize(color)), row('CUT :', cut), row('BOB QTY :', String(bobQty)), row('GR. WT :', `${fixed3(gross)} kg`), _jsxs("div", { style: { display: 'grid', gridTemplateColumns: '1.2fr 0.9fr 0.9fr', borderTop: '0.7mm solid #000' }, children: [_jsxs("div", { style: { padding: '2mm', borderRight: '0.7mm solid #000' }, children: [_jsx("div", { style: { fontWeight: 900 }, children: "BOB. WT :" }), _jsxs("div", { style: { marginTop: '1mm', fontWeight: 800 }, children: [fixed3(bobWeight), " kg"] })] }), _jsxs("div", { style: { padding: '1mm 0', borderRight: '0.7mm solid #000', fontWeight: 900, textAlign: 'center', lineHeight: 1.05 }, children: ["BO", _jsx("br", {}), "X.", _jsx("br", {}), "WT :"] }), _jsxs("div", { style: { padding: '1mm', fontWeight: 900, textAlign: 'center' }, children: [fixed3(boxWeight), _jsx("br", {}), "kg"] })] }), row('NET WT :', `${fixed3(net)} kg`), row('OP :', operator || ''), row('HE :', helper || ''), _jsx("div", { style: { borderTop: '0.7mm solid #000', height: '6mm' } })] }), _jsxs("div", { style: { marginTop: '2mm', textAlign: 'center' }, children: [_jsx("svg", { id: "modal_barcode", style: { width: '100%' } }), _jsx("div", { style: { fontSize: '4mm', letterSpacing: '0.8mm', marginTop: '1mm' }, children: barcode })] })] }));
});
function row(label, value) {
    return (_jsxs("div", { style: { display: 'grid', gridTemplateColumns: '1fr 2fr', borderTop: '0.7mm solid #000' }, children: [_jsx("div", { style: { padding: '2mm', borderRight: '0.7mm solid #000', fontWeight: 900 }, children: label }), _jsx("div", { style: { padding: '2mm', fontWeight: 800 }, children: value })] }));
}
function fixed3(n) { return Number(n).toFixed(3); }
function capitalize(s) { return s ? s[0].toUpperCase() + s.slice(1) : s; }
