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

/**
 * Printable label 75mm x 125mm (portrait) with inner header band and row grid
 * to match the provided reference.
 */
export const LabelPreview = forwardRef<HTMLDivElement, Props>(function LabelPreview (props, ref) {
  const {
    header = 'SURYARAJ POLYMER',
    dateText, color, cut, bobQty, gross, bobWeight, boxWeight, net, operator, helper, barcode
  } = props

  useEffect(() => {
    try {
      const svg = document.getElementById('modal_barcode') as SVGSVGElement | null
      if (svg) JsBarcode(svg, barcode, { format: 'code128', width: 2.2, height: 36, displayValue: false, margin: 0 })
    } catch {}
  }, [barcode])

  return (
    <div
      ref={ref as any}
      style={{
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
      }}
    >
      {/* Inner panel (everything above the barcode band) */}
      <div style={{ border: '0.7mm solid #000', borderRadius: '3mm', overflow: 'hidden' }}>
        {/* Header band */}
        <div
          style={{
            fontSize: '7mm',
            fontWeight: 900,
            fontStyle: 'italic',
            textAlign: 'center',
            textTransform: 'uppercase',
            padding: '2mm 2mm 2.5mm',
            letterSpacing: '0.2mm',
            borderBottom: '0.7mm solid #000',
          }}
        >
          {header}
        </div>

        {/* Rows */}
        {row('DATE :', multiline(dateText))}
        {row('COLOR :', capitalize(color))}
        {row('CUT :', cut)}
        {row('BOB QTY :', String(bobQty))}
        {row('GR. WT :', `${fixed3(gross)} kg`)}

        {/* Special three-column row (BOB WT / BOX WT) */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', borderTop: '0.7mm solid #000' }}>
          <CellLabel>BOB. WT :</CellLabel>
          <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr 0.9fr' }}>
            {/* value for bob wt (left of the mini-columns) */}
            <div style={{ padding: '2mm', fontWeight: 800, borderRight: '0.7mm solid #000' }}>
              {fixed3(bobWeight)} kg
            </div>
            {/* “BO / X. / WT :” stacked label */}
            <div
              style={{
                padding: '1mm 0',
                textAlign: 'center',
                fontWeight: 900,
                borderRight: '0.7mm solid #000',
                lineHeight: 1.06,
              }}
            >
              BO<br />X.<br />WT :
            </div>
            {/* box weight value */}
            <div style={{ padding: '1mm', textAlign: 'center', fontWeight: 900 }}>
              {fixed3(boxWeight)}<br />kg
            </div>
          </div>
        </div>

        {row('NET WT :', `${fixed3(net)} kg`)}
        {row('OP :', operator || '')}
        {row('HE :', helper || '')}

        {/* thin empty band like the reference before barcode area */}
        <div style={{ borderTop: '0.7mm solid #000', height: '6mm' }} />
      </div>

      {/* Barcode band */}
      <div style={{ marginTop: '3mm', textAlign: 'center' }}>
        <svg id="modal_barcode" style={{ width: '78%', display: 'inline-block' }} />
        <div style={{ fontSize: '4mm', letterSpacing: '0.8mm', marginTop: '1mm' }}>{barcode}</div>
      </div>
    </div>
  )
})

/* ---------- helpers ---------- */

function row (label: string, value: string | JSX.Element) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', borderTop: '0.7mm solid #000' }}>
      <CellLabel>{label}</CellLabel>
      <div style={{ padding: '2mm', fontWeight: 800 }}>{value}</div>
    </div>
  )
}

function multiline (s: string) {
  // allow natural wrapping like your reference (date + time on two lines when needed)
  const parts = String(s).split('\n')
  return (
    <div style={{ whiteSpace: 'pre-wrap' }}>
      {parts.map((p, i) => <div key={i}>{p}</div>)}
    </div>
  )
}

function fixed3 (n: number | string) { return Number(n).toFixed(3) }
function capitalize (s: string) { return s ? s[0].toUpperCase() + s.slice(1) : s }

function CellLabel ({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ padding: '2mm', borderRight: '0.7mm solid #000', fontWeight: 900 }}>
      {children}
    </div>
  )
}
