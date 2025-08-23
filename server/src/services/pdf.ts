import fs from "fs";
import path from "path";
import PDFDocument from "pdfkit";
import dayjs from "dayjs";
import { config } from "../config.js";

type Customer = {
  id: number;
  name: string;
  address?: string | null;
  gstin?: string | null;
  mobile?: string | null;
};

type ChallanItem = {
  item_index: number;
  metallic_name: string;
  cut_name: string;
  operator_name: string;
  helper_name?: string | null;
  bob_type_name: string;
  box_type_name: string;
  bob_qty: number;
  gross_wt: number;
  tare_wt: number;
  net_wt: number;
};

export async function generateChallanPdf(options: {
  challanNo: number;
  dateISO: string; // yyyy-mm-dd
  customer: Customer;
  shiftName: string;
  items: ChallanItem[];
  firm?: { id: number; name: string; address?: string | null; gstin?: string | null; mobile?: string | null; email?: string | null };
  lotNumber?: string | number | null;
}): Promise<{ absolutePath: string; relativePath: string }> {
  const { challanNo, dateISO, customer, shiftName, items, firm, lotNumber } = options;

  const date = dayjs(dateISO);
  const yearYY = date.format("YY");
  const yearYYYY = date.format("YYYY");
  const monthMM = date.format("MM");

  // Build a richer filename including customer and item summary (metallics/cuts)
  const uniqueMetallics = Array.from(new Set(items.map(i => i.metallic_name))).join('-')
  const uniqueCuts = Array.from(new Set(items.map(i => i.cut_name))).join('-')
  const parts = [customer.name, uniqueMetallics, uniqueCuts].filter(p => p && String(p).trim().length > 0)
  // Sanitize and limit length to keep filenames filesystem-friendly
  const combined = parts.join('_').replace(/[^a-zA-Z0-9-_ ]/g, '').replace(/\s+/g, '_')
  const safeCombined = combined.length > 60 ? combined.slice(0, 60) : combined
  const filename = `CH-${yearYY}-${String(challanNo).padStart(6, "0")}${safeCombined ? `_${safeCombined}` : ''}.pdf`;
  const dir = path.resolve(config.projectRoot, "Challans", yearYYYY, monthMM);
  await fs.promises.mkdir(dir, { recursive: true });
  const absolutePath = path.join(dir, filename);

  // Remove old if exists
  try { await fs.promises.unlink(absolutePath); } catch {}

  const doc = new PDFDocument({ 
    size: "A4",
    layout: "landscape",
    margin: 15, // Reduced margin for more space
    // Optimize for faster rendering and smaller file size
    compress: true,
    autoFirstPage: true,
    bufferPages: false // Don't buffer pages for faster generation
  });
  
  const writeStream = fs.createWriteStream(absolutePath);
  doc.pipe(writeStream);

  // Colors
  const borderColor = "#000000";
  const lightText = "#111111";
  const grayText = "#444444";

  // Page dimensions (A4 landscape)
  const pageWidth = doc.page.width;
  const pageHeight = doc.page.height;
  const margin = 15;
  
  // Calculate safe drawing area
  const safeWidth = pageWidth - (margin * 2);
  const safeHeight = pageHeight - (margin * 2);
  
  // Split into two equal halves with gutter
  const gutter = 8;
  const halfWidth = (safeWidth - gutter) / 2;
  const halfHeight = safeHeight;
  
  // Starting positions
  const leftX = margin;
  const rightX = margin + halfWidth + gutter;
  const startY = margin;

  // Draw center divider line
  const centerX = margin + halfWidth + (gutter / 2);
  doc.save();
  doc.lineWidth(0.5).dash(3, { space: 3 }).strokeColor("#9CA3AF");
  doc.moveTo(centerX, startY).lineTo(centerX, startY + halfHeight).stroke();
  doc.undash();
  doc.restore();

  // Function to draw one half (ORIGINAL or COPY)
  function drawHalf(originX: number, watermark: string) {
    const boxX = originX;
    const boxY = startY;
    const boxW = halfWidth;
    const boxH = halfHeight;

    // Draw outer border
    doc.rect(boxX, boxY, boxW, boxH).stroke(borderColor);

    // Watermark (centered and rotated)
    doc.save();
    doc.opacity(0.08);
    doc.fillColor("#000000");
    const centerX = boxX + boxW / 2;
    const centerY = boxY + boxH / 2;
    doc.rotate(-30, { origin: [centerX, centerY] });
    doc.font("Helvetica-Bold").fontSize(32).text(watermark, centerX - 100, centerY - 15, { width: 200, align: "center" });
    doc.restore();

    // Title
    doc.font("Helvetica-Bold").fontSize(14).fillColor(lightText).text("Delivery Challan", boxX, boxY + 8, { width: boxW, align: "center" });

    // Challan No and Date row
    const infoY = boxY + 20;
    doc.font("Helvetica-Bold").fontSize(8).fillColor(grayText);
    doc.text(`Challan No: ${String(challanNo).padStart(6, "0")}`, boxX + 12, infoY + 6);
    doc.text(`Date: ${date.format("DD/MM/YYYY")}`, boxX + boxW - 80, infoY + 6, { width: 70, align: "right" });

    // Shift & Customer info
    // const smallY = infoY + 30;
    // doc.text(`Shift: ${shiftName}`, boxX + 12, smallY);
    // doc.text(`Customer: ${customer.name}`, boxX + boxW / 2, smallY);

    // From / To boxes
    const partyY = infoY + 20;
    const colW = (boxW - 18) / 2;
    doc.rect(boxX + 6, partyY, colW, 48).stroke(borderColor);
    doc.rect(boxX + 12 + colW, partyY, colW, 48).stroke(borderColor);

    // From section
    doc.font("Helvetica-Bold").fontSize(8).fillColor(lightText).text("From:", boxX + 10, partyY + 4);
    doc.font("Helvetica").fontSize(8).fillColor(lightText);
    const firmName = firm?.name || "Company Name";
    const firmAddr = firm?.address || "";
    doc.text(firmName, boxX + 35, partyY + 4);
    
    // From Address header and data
    doc.font("Helvetica-Bold").fontSize(8).fillColor(lightText).text("Address:", boxX + 10, partyY + 16);
    if (firmAddr) {
      doc.font("Helvetica").fontSize(8).fillColor(lightText);
      doc.text(firmAddr, boxX + 47, partyY + 16, { width: colW - 35 });
    }
    
    // From Mobile header and data
    doc.font("Helvetica-Bold").fontSize(8).fillColor(lightText).text("Mobile No:", boxX + 10, partyY + 28);
    if (firm?.mobile) {
      doc.font("Helvetica").fontSize(8).fillColor(lightText);
      doc.text(firm.mobile, boxX + 53, partyY + 28, { width: colW - 35 });
    }

    // To section
    doc.font("Helvetica-Bold").fontSize(8).fillColor(lightText).text("To:", boxX + 18 + colW, partyY + 4);
    doc.font("Helvetica").fontSize(8).fillColor(lightText);
    doc.text(customer.name, boxX + 33 + colW, partyY + 4, { width: colW - 12 });
    
    // To Address header and data
    doc.font("Helvetica-Bold").fontSize(8).fillColor(lightText).text("Address:", boxX + 18 + colW, partyY + 16);
    if (customer.address) {
      doc.font("Helvetica").fontSize(8).fillColor(lightText);
      doc.text(String(customer.address), boxX + 55 + colW, partyY + 16, { width: colW - 35 });
    }
    
    // To Mobile header and data
    doc.font("Helvetica-Bold").fontSize(8).fillColor(lightText).text("Mobile No:", boxX + 18 + colW, partyY + 28);
    if (customer.mobile) {
      doc.font("Helvetica").fontSize(8).fillColor(lightText);
      doc.text(String(customer.mobile), boxX + 60 + colW, partyY + 28, { width: colW - 35 });
    }

    // LOT NO - positioned below the From/To boxes
    // const lotY = partyY + 54;
    // const lotDisplay = String(lotNumber ?? "-");
    
    // doc.font("Helvetica-Bold").fontSize(8).fillColor(lightText).text(`LOT NO:- ${lotDisplay}`, boxX + 10, lotY);

    // Table setup - start below From/To boxes
    const tableY = partyY + 54;
    const headerH = 16;
    const totalH = 16;
    const maxRowsPerBlock = 20;

    // Reserve space for signatures and margins
    const signatureSpace = 60;

    // We'll render two columns side-by-side inside the half: left (1-20) and right (21-40)
    const spacingBetweenColumns = 12;
    const colBlockW = (boxW - 12 - spacingBetweenColumns) / 2; // width for each column block

    // Compute available vertical space for rows inside a column block
    const availableHeightForRows = boxH - (tableY - boxY) - signatureSpace - headerH - totalH; // space for rows
    let rowH = Math.floor(availableHeightForRows / maxRowsPerBlock);
    if (rowH < 10) rowH = 10;
    if (rowH > 18) rowH = 18;

     // Column widths inside a block - adjusted for "Sr No" header
     const innerColSr = Math.max(25, 0.12 * (colBlockW - 6)); // Minimum 25pt width for "Sr No"
     const innerColDetails = 0.48 * (colBlockW - 6);
     const innerColNet = 0.20 * (colBlockW - 6);
     const innerColQty = 0.20 * (colBlockW - 6);

    function drawColumn(startIndex: number, originX: number, yStart: number) {
      let rowY = yStart;
      let total = { qty: 0, net: 0 };

             // Header
       doc.rect(originX, rowY, colBlockW, headerH).stroke(borderColor);
       
       // Draw vertical lines in header to separate columns
       const headerCol1X = originX + innerColSr;
       const headerCol2X = originX + innerColSr + innerColDetails;
       const headerCol3X = originX + innerColSr + innerColDetails + innerColNet;
       
       doc.lineWidth(0.5).strokeColor(borderColor);
       doc.moveTo(headerCol1X, rowY).lineTo(headerCol1X, rowY + headerH).stroke();
       doc.moveTo(headerCol2X, rowY).lineTo(headerCol2X, rowY + headerH).stroke();
       doc.moveTo(headerCol3X, rowY).lineTo(headerCol3X, rowY + headerH).stroke();
       
       doc.font("Helvetica-Bold").fontSize(8).fillColor(lightText);
       doc.text("Sr No", originX + 2, rowY + 4, { width: innerColSr, align: "center" });
       doc.text("Details", originX + 6 + innerColSr, rowY + 4, { width: innerColDetails - 8, align: "center" });
       doc.text("Net.WT", originX + 4 + innerColSr + innerColDetails, rowY + 4, { width: innerColNet - 4, align: "center" });
       doc.text("Bobbins", originX + 4 + innerColSr + innerColDetails + innerColNet, rowY + 4, { width: innerColQty - 4, align: "center" });

      rowY += headerH;

             for (let i = 0; i < maxRowsPerBlock; i++) {
         const idx = startIndex + i;
         if (rowY + rowH > boxY + boxH - signatureSpace - totalH) break;
         
         // Draw row rectangle
         doc.rect(originX, rowY, colBlockW, rowH).stroke(borderColor);
         
         // Draw vertical lines to separate columns
         const col1X = originX + innerColSr;
         const col2X = originX + innerColSr + innerColDetails;
         const col3X = originX + innerColSr + innerColDetails + innerColNet;
         
         doc.lineWidth(0.5).strokeColor(borderColor);
         doc.moveTo(col1X, rowY).lineTo(col1X, rowY + rowH).stroke();
         doc.moveTo(col2X, rowY).lineTo(col2X, rowY + rowH).stroke();
         doc.moveTo(col3X, rowY).lineTo(col3X, rowY + rowH).stroke();
         
         // Always show serial number
         doc.font("Helvetica").fontSize(8).fillColor(lightText);
         doc.text(String(idx + 1).padStart(2, "0"), originX + 2, rowY + 4, { width: innerColSr, align: "center" });
         
         if (idx < items.length) {
           const it = items[idx];
           const details = `${it.metallic_name} - ${it.cut_name}`;
           doc.text(details, originX + 6 + innerColSr, rowY + 4, { width: innerColDetails - 8 });
           doc.text(it.net_wt.toFixed(3), originX + 4 + innerColSr + innerColDetails, rowY + 4, { width: innerColNet - 4, align: "center" });
           doc.text(String(it.bob_qty), originX + 4 + innerColSr + innerColDetails + innerColNet, rowY + 4, { width: innerColQty - 4, align: "center" });
           total.qty += it.bob_qty; total.net += it.net_wt;
         }
         rowY += rowH;
       }

      // Do not draw per-column total here; return totals so caller can render combined total
      return { y: rowY, total };
    }

    const leftColX = boxX + 6;
    const rightColX = leftColX + colBlockW + spacingBetweenColumns;
    const firstCol = drawColumn(0, leftColX, tableY);
    const secondCol = drawColumn(20, rightColX, tableY);

    // Combined totals (both columns) - display outside the inner column boxes in bold
    const combinedNet = Number((firstCol.total.net || 0) + (secondCol.total.net || 0));
    const combinedQty = Number((firstCol.total.qty || 0) + (secondCol.total.qty || 0));
    const totalsY = Math.min(boxY + boxH - 60, Math.max(firstCol.y, secondCol.y) + 6);
    doc.font("Helvetica-Bold").fontSize(9).fillColor(lightText);
    doc.text(`Total Weight: ${combinedNet.toFixed(3)} kg`, boxX + 10, totalsY);
    doc.text(`Total Bobbins: ${combinedQty} PCS`, boxX + boxW - 180, totalsY, { width: 170, align: "right" });

    // Signatures at bottom (placed below combined totals)
    const sigY = Math.min(boxY + boxH - 30, totalsY + 26);
    doc.font("Helvetica").fontSize(8).fillColor(lightText);
    doc.text("Received By:", boxX + 10, sigY);
    doc.text("___________________", boxX + 10, sigY + 14);
    const authorizedSignText = firm ? `Authorized Sign (${firm.name}):` : "Authorized Sign:";
    doc.text(authorizedSignText, boxX + boxW - 130, sigY, { width: 120, align: "right" });
    doc.text("___________________", boxX + boxW - 130, sigY + 14, { width: 120, align: "right" });
  }

  // Ensure numeric fields are numbers (some DB drivers may return strings)
  for (let idx = 0; idx < items.length; idx++) {
    const it: any = items[idx]
    it.net_wt = Number(it.net_wt || 0)
    it.bob_qty = Number(it.bob_qty || 0)
    it.tare_wt = Number(it.tare_wt || 0)
    it.gross_wt = Number(it.gross_wt || 0)
  }

  // Draw both halves
  drawHalf(leftX, "ORIGINAL");
  drawHalf(rightX, "COPY");

  doc.end();

  await new Promise<void>((resolve, reject) => {
    writeStream.on("finish", () => resolve());
    writeStream.on("error", reject);
  });

  const relativePath = path.relative(config.projectRoot, absolutePath);
  return { absolutePath, relativePath };
}
