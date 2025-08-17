import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { forwardRef, useEffect } from 'react';
import JsBarcode from 'jsbarcode';
/**
 * Printable label 75mm x 125mm (portrait) with inner header band and row grid
 * to match the provided reference.
 */
export const LabelPreview = forwardRef(function LabelPreview(props, ref) {
    const { header = 'SURYARAJ POLYMER', dateText, color, cut, bobQty, gross, bobWeight, boxWeight, net, operator, helper, barcode } = props;
    useEffect(() => {
        try {
            const svg = document.getElementById('modal_barcode');
            if (svg)
                JsBarcode(svg, barcode, { format: 'code128', width: 2.2, height: 36, displayValue: false, margin: 0 });
        }
        catch { }
    }, [barcode]);
    return (_jsxs("div", { ref: ref, style: {
            width: '75mm',
            height: '125mm',
            border: '1.4mm solid #000',
            borderRadius: '6mm',
            padding: '2.5mm',
            boxSizing: 'border-box',
            fontFamily: 'Arial, Helvetica, sans-serif',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
        }, children: [_jsxs("div", { style: { border: '0.7mm solid #000', borderRadius: '3mm', overflow: 'hidden' }, children: [_jsx("div", { style: {
                            fontSize: '7mm',
                            fontWeight: 900,
                            fontStyle: 'italic',
                            textAlign: 'center',
                            textTransform: 'uppercase',
                            padding: '2mm 2mm 2.5mm',
                            letterSpacing: '0.2mm',
                            borderBottom: '0.7mm solid #000',
                        }, children: header }), row('DATE :', multiline(dateText)), row('COLOR :', capitalize(color)), row('CUT :', cut), row('BOB QTY :', String(bobQty)), row('GR. WT :', `${fixed3(gross)} kg`), _jsxs("div", { style: { display: 'grid', gridTemplateColumns: '1fr 2fr', borderTop: '0.7mm solid #000' }, children: [_jsx(CellLabel, { children: "BOB. WT :" }), _jsxs("div", { style: { display: 'grid', gridTemplateColumns: '1.1fr 0.9fr 0.9fr' }, children: [_jsxs("div", { style: { padding: '2mm', fontWeight: 800, borderRight: '0.7mm solid #000' }, children: [fixed3(bobWeight), " kg"] }), _jsxs("div", { style: {
                                            padding: '1mm 0',
                                            textAlign: 'center',
                                            fontWeight: 900,
                                            borderRight: '0.7mm solid #000',
                                            lineHeight: 1.06,
                                        }, children: ["BO", _jsx("br", {}), "X.", _jsx("br", {}), "WT :"] }), _jsxs("div", { style: { padding: '1mm', textAlign: 'center', fontWeight: 900 }, children: [fixed3(boxWeight), _jsx("br", {}), "kg"] })] })] }), row('NET WT :', `${fixed3(net)} kg`), row('OP :', operator || ''), row('HE :', helper || ''), _jsx("div", { style: { borderTop: '0.7mm solid #000', height: '6mm' } })] }), _jsxs("div", { style: { marginTop: '3mm', textAlign: 'center' }, children: [_jsx("svg", { id: "modal_barcode", style: { width: '78%', display: 'inline-block' } }), _jsx("div", { style: { fontSize: '4mm', letterSpacing: '0.8mm', marginTop: '1mm' }, children: barcode })] })] }));
});
/* ---------- helpers ---------- */
function row(label, value) {
    return (_jsxs("div", { style: { display: 'grid', gridTemplateColumns: '1fr 2fr', borderTop: '0.7mm solid #000' }, children: [_jsx(CellLabel, { children: label }), _jsx("div", { style: { padding: '2mm', fontWeight: 800 }, children: value })] }));
}
function multiline(s) {
    // allow natural wrapping like your reference (date + time on two lines when needed)
    const parts = String(s).split('\n');
    return (_jsx("div", { style: { whiteSpace: 'pre-wrap' }, children: parts.map((p, i) => _jsx("div", { children: p }, i)) }));
}
function fixed3(n) { return Number(n).toFixed(3); }
function capitalize(s) { return s ? s[0].toUpperCase() + s.slice(1) : s; }
function CellLabel({ children }) {
    return (_jsx("div", { style: { padding: '2mm', borderRight: '0.7mm solid #000', fontWeight: 900 }, children: children }));
}
