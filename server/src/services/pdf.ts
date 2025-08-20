import fs from "fs";
import path from "path";
import PDFDocument from "pdfkit";
import dayjs from "dayjs";
import { config } from "../config";

type Customer = {
  id: number;
  name: string;
  address?: string | null;
  gstin?: string | null;
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
  pendingWeightKg?: number | null;
}): Promise<{ absolutePath: string; relativePath: string }> {
  const { challanNo, dateISO, customer, shiftName, items, firm, lotNumber, pendingWeightKg } = options;

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
    autoFirstPage: true
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
  const gutter = 12;
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
    doc.font("Helvetica-Bold").fontSize(32).text(watermark, centerX - 70, centerY - 15, { width: 140, align: "center" });
    doc.restore();

    // Title
    doc.font("Helvetica-Bold").fontSize(14).fillColor(lightText).text("Delivery Challan", boxX, boxY + 8, { width: boxW, align: "center" });

    // Challan No and Date row
    const infoY = boxY + 32;
    doc.rect(boxX + 6, infoY, boxW - 12, 24).stroke(borderColor);
    doc.font("Helvetica").fontSize(8).fillColor(grayText);
    doc.text(`Challan No: ${String(challanNo).padStart(6, "0")}`, boxX + 12, infoY + 6);
    doc.text(`Date: ${date.format("DD/MM/YYYY")}`, boxX + boxW / 2, infoY + 6);

    // Shift & Customer info
    const smallY = infoY + 30;
    doc.text(`Shift: ${shiftName}`, boxX + 12, smallY);
    doc.text(`Customer: ${customer.name}`, boxX + boxW / 2, smallY);

    // From / To boxes
    const partyY = smallY + 14;
    const colW = (boxW - 18) / 2;
    doc.rect(boxX + 6, partyY, colW, 48).stroke(borderColor);
    doc.rect(boxX + 12 + colW, partyY, colW, 48).stroke(borderColor);

    // From section
    doc.font("Helvetica-Bold").fontSize(8).fillColor(lightText).text("From:", boxX + 10, partyY + 4);
    doc.font("Helvetica").fontSize(8).fillColor(lightText);
    const firmName = firm?.name || "Company Name";
    const firmAddr = firm?.address || "";
    doc.text(firmName, boxX + 10, partyY + 16);
    if (firmAddr) doc.text(firmAddr, boxX + 10, partyY + 26, { width: colW - 12 });

    // To section
    doc.font("Helvetica-Bold").fontSize(8).fillColor(lightText).text("To:", boxX + 18 + colW, partyY + 4);
    doc.font("Helvetica").fontSize(8).fillColor(lightText);
    doc.text(customer.name, boxX + 18 + colW, partyY + 16, { width: colW - 12 });
    if (customer.address) doc.text(String(customer.address), boxX + 18 + colW, partyY + 26, { width: colW - 12 });

    // LOT NO and Pending Weight - positioned below the From/To boxes
    const lotY = partyY + 54;
    const lotDisplay = String(lotNumber ?? "-");
    const pendingWeightDisplay = (pendingWeightKg !== null && pendingWeightKg !== undefined) ? `${Number(pendingWeightKg).toFixed(2)} kg` : "-";
    
    doc.font("Helvetica-Bold").fontSize(8).fillColor(lightText).text(`LOT NO:- ${lotDisplay}`, boxX + 10, lotY);
    doc.font("Helvetica").fontSize(8).fillColor(grayText).text(`(Total Pending Weight: ${pendingWeightDisplay})`, boxX + boxW - 140, lotY, { width: 130, align: "right" });

    // Table setup - start below LOT NO
    const tableY = lotY + 16;
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

    // Column widths inside a block
    const innerColSr = 0.08 * (colBlockW - 6);
    const innerColDetails = 0.52 * (colBlockW - 6);
    const innerColNet = 0.20 * (colBlockW - 6);
    const innerColQty = 0.20 * (colBlockW - 6);

    function drawColumn(startIndex: number, originX: number, yStart: number) {
      let rowY = yStart;
      let total = { qty: 0, net: 0 };

      // Header
      doc.rect(originX, rowY, colBlockW, headerH).stroke(borderColor);
      doc.font("Helvetica-Bold").fontSize(8).fillColor(lightText);
      doc.text("Sr", originX + 2, rowY + 4, { width: innerColSr, align: "center" });
      doc.text("Details", originX + 2 + innerColSr, rowY + 4, { width: innerColDetails, align: "center" });
      doc.text("Net.WT", originX + 2 + innerColSr + innerColDetails, rowY + 4, { width: innerColNet, align: "center" });
      doc.text("Bobbins", originX + 2 + innerColSr + innerColDetails + innerColNet, rowY + 4, { width: innerColQty, align: "center" });

      rowY += headerH;

      for (let i = 0; i < maxRowsPerBlock; i++) {
        const idx = startIndex + i;
        if (rowY + rowH > boxY + boxH - signatureSpace - totalH) break;
        doc.rect(originX, rowY, colBlockW, rowH).stroke(borderColor);
        if (idx < items.length) {
          const it = items[idx];
          const details = `${it.metallic_name} - ${it.cut_name}`;
          doc.font("Helvetica").fontSize(8).fillColor(lightText);
          doc.text(String(idx + 1).padStart(2, "0"), originX + 2, rowY + 4, { width: innerColSr, align: "center" });
          doc.text(details, originX + 2 + innerColSr, rowY + 4, { width: innerColDetails - 4 });
          doc.text(it.net_wt.toFixed(3), originX + 2 + innerColSr + innerColDetails, rowY + 4, { width: innerColNet, align: "center" });
          doc.text(String(it.bob_qty), originX + 2 + innerColSr + innerColDetails + innerColNet, rowY + 4, { width: innerColQty, align: "center" });
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
