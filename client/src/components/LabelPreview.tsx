import { forwardRef, useEffect } from 'react'
import JsBarcode from 'jsbarcode'

type Props = {
  header?: string
  dateText: string
  color: string
  cut: string
  bobQty: number
  gross: number
  bobWeight: number
  boxWeight: number
  net: number
  operator?: string
  helper?: string
  barcode: string
}

// Printable label 75mm x 125mm (portrait). We'll style in mm units so it matches printers.
export const LabelPreview = forwardRef<HTMLDivElement, Props>(function LabelPreview(props, ref) {
  const { header = 'Label', dateText, color, cut, bobQty, gross, bobWeight, boxWeight, net, operator, helper, barcode } = props

  useEffect(() => {
    try {
      const svg = document.getElementById('modal_barcode') as SVGSVGElement | null
      if (svg) JsBarcode(svg, barcode, { format: 'code128', width: 2.2, height: 38, displayValue: false, margin: 0 })
    } catch {}
  }, [barcode])

  return (
    <div ref={ref as any} style={{ width: '75mm', height: '125mm', border: '1.4mm solid #000', borderRadius: '6mm', padding: '2.5mm', boxSizing: 'border-box', fontFamily: 'Arial, Helvetica, sans-serif' }}>
      <div style={{ fontSize: '8mm', fontWeight: 900, fontStyle: 'italic', textAlign: 'center', letterSpacing: '0.2mm', marginBottom: '1.5mm', textTransform: 'uppercase' }}>{header}</div>
      <div style={{ border: '0.7mm solid #000', borderRadius: '3mm', overflow: 'hidden' }}>
        {row('DATE :', dateText)}
        {row('COLOR :', capitalize(color))}
        {row('CUT :', cut)}
        {row('BOB QTY :', String(bobQty))}
        {row('GR. WT :', `${fixed3(gross)} kg`)}
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.9fr 0.9fr', borderTop: '0.7mm solid #000' }}>
          <div style={{ padding: '2mm', borderRight: '0.7mm solid #000' }}>
            <div style={{ fontWeight: 900 }}>BOB. WT :</div>
            <div style={{ marginTop: '1mm', fontWeight: 800 }}>{fixed3(bobWeight)} kg</div>
          </div>
          <div style={{ padding: '1mm 0', borderRight: '0.7mm solid #000', fontWeight: 900, textAlign: 'center', lineHeight: 1.05 }}>BO<br/>X.<br/>WT :</div>
          <div style={{ padding: '1mm', fontWeight: 900, textAlign: 'center' }}>{fixed3(boxWeight)}<br/>kg</div>
        </div>
        {row('NET WT :', `${fixed3(net)} kg`)}
        {row('OP :', operator || '')}
        {row('HE :', helper || '')}
        <div style={{ borderTop: '0.7mm solid #000', height: '6mm' }} />
      </div>
      <div style={{ marginTop: '2mm', textAlign: 'center' }}>
        <svg id="modal_barcode" style={{ width: '100%' }} />
        <div style={{ fontSize: '4mm', letterSpacing: '0.8mm', marginTop: '1mm' }}>{barcode}</div>
      </div>
    </div>
  )
})

function row(label: string, value: string) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', borderTop: '0.7mm solid #000' }}>
      <div style={{ padding: '2mm', borderRight: '0.7mm solid #000', fontWeight: 900 }}>{label}</div>
      <div style={{ padding: '2mm', fontWeight: 800 }}>{value}</div>
    </div>
  )
}

function fixed3(n: number) { return Number(n).toFixed(3) }
function capitalize(s: string) { return s ? s[0].toUpperCase() + s.slice(1) : s }
