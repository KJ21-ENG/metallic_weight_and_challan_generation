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
}): Promise<{ absolutePath: string; relativePath: string }> {
  const { challanNo, dateISO, customer, shiftName, items, firm } = options;

  const date = dayjs(dateISO);
  const yearYY = date.format("YY");
  const yearYYYY = date.format("YYYY");
  const monthMM = date.format("MM");

  const filename = `CH-${yearYY}-${String(challanNo).padStart(6, "0")}.pdf`;
  const dir = path.resolve(config.projectRoot, "Challans", yearYYYY, monthMM);
  await fs.promises.mkdir(dir, { recursive: true });
  const absolutePath = path.join(dir, filename);

  // Remove old if exists
  try { await fs.promises.unlink(absolutePath); } catch {}

  const doc = new PDFDocument({ 
    size: "A4",
    layout: "landscape",
    margin: 28,
    autoFirstPage: true
  });
  
  const writeStream = fs.createWriteStream(absolutePath);
  doc.pipe(writeStream);

  // Colors
  const borderColor = "#000000";
  const lightText = "#111111";
  const grayText = "#444444";

  // Dimensions
  const pageLeft = doc.page.margins.left;
  const pageRight = doc.page.width - doc.page.margins.right;
  const gutter = 10;
  const halfWidth = (pageRight - pageLeft - gutter) / 2;
  const topY = 50;

  // Cut line in the middle
  const midX = pageLeft + halfWidth + gutter / 2;
  doc.save();
  doc.lineWidth(0.5).dash(3, { space: 3 }).strokeColor("#9CA3AF");
  doc.moveTo(midX, topY - 20).lineTo(midX, doc.page.height - 40).stroke();
  doc.undash();
  doc.restore();

  function drawHalf(originX: number, watermark: string) {
    const boxX = originX;
    const boxY = topY;
    const boxW = halfWidth - gutter / 2;
    const boxH = doc.page.height - topY - 40;

    // Outer border
    doc.rect(boxX, boxY, boxW, boxH).stroke(borderColor);

    // Watermark
    doc.save();
    doc.opacity(0.08);
    doc.fillColor("#000000");
    const centerX = boxX + boxW / 2;
    const centerY = boxY + boxH / 2;
    doc.rotate(-30, { origin: [centerX, centerY] });
    doc.font("Helvetica-Bold").fontSize(48).text(watermark, centerX - 120, centerY - 30, { width: 240, align: "center" });
    doc.restore();

    // Title
    doc.font("Helvetica-Bold").fontSize(16).fillColor(lightText).text("Delivery Challan", boxX, boxY + 10, { width: boxW, align: "center" });

    // Challan No and Date row
    const infoY = boxY + 38;
    doc.rect(boxX + 8, infoY, boxW - 16, 28).stroke(borderColor);
    doc.font("Helvetica").fontSize(9).fillColor(grayText);
    doc.text(`Challan No: ${String(challanNo).padStart(6, "0")}`, boxX + 16, infoY + 8);
    doc.text(`Date: ${date.format("DD/MM/YYYY")}`, boxX + boxW / 2, infoY + 8);

    // Shift & Customer small line
    const smallY = infoY + 34;
    doc.text(`Shift: ${shiftName}`, boxX + 16, smallY);
    doc.text(`Customer: ${customer.name}`, boxX + boxW / 2, smallY);

    // From / To boxes
    const partyY = smallY + 10;
    const colW = (boxW - 24) / 2;
    doc.rect(boxX + 8, partyY, colW, 64).stroke(borderColor);
    doc.rect(boxX + 16 + colW, partyY, colW, 64).stroke(borderColor);

    doc.font("Helvetica-Bold").fontSize(9).fillColor(lightText).text("From:", boxX + 12, partyY + 6);
    doc.font("Helvetica").fontSize(9).fillColor(lightText);
    const firmName = firm?.name || "";
    const firmAddr = firm?.address || "";
    const firmGstin = firm?.gstin ? `GSTIN: ${firm.gstin}` : "";
    const firmMobile = firm?.mobile ? `Mo: ${firm.mobile}` : "";
    const firmEmail = firm?.email ? `Email: ${firm.email}` : "";
    doc.text(firmName, boxX + 12, partyY + 20);
    if (firmAddr) doc.text(firmAddr, boxX + 12, partyY + 32, { width: colW - 12 });
    if (firmGstin) doc.text(firmGstin, boxX + 12, partyY + 50, { width: colW - 12 });
    if (firmMobile) doc.text(firmMobile, boxX + 12, partyY + 62, { width: colW - 12 });
    if (firmEmail) doc.text(firmEmail, boxX + 12, partyY + 74, { width: colW - 12 });

    doc.font("Helvetica-Bold").fontSize(9).fillColor(lightText).text("To:", boxX + 20 + colW, partyY + 6);
    doc.font("Helvetica").fontSize(9).fillColor(lightText);
    doc.text(customer.name, boxX + 20 + colW, partyY + 20, { width: colW - 12 });
    if (customer.address) doc.text(String(customer.address), boxX + 20 + colW, partyY + 32, { width: colW - 12 });
    if (customer.gstin) doc.text(`GSTIN: ${customer.gstin}`, boxX + 20 + colW, partyY + 56, { width: colW - 12 });

    // Table: two sets of 30 rows each
    const tableY = partyY + 80;
    const colSr = 0.07 * (boxW - 16);
    const colDetails = 0.53 * (boxW - 16);
    const colNet = 0.20 * (boxW - 16);
    const colQty = 0.20 * (boxW - 16);

    // Header row
    doc.rect(boxX + 8, tableY, boxW - 16, 18).stroke(borderColor);
    doc.font("Helvetica-Bold").fontSize(9).fillColor(lightText);
    let cx = boxX + 8;
    doc.text("Sr", cx, tableY + 4, { width: colSr, align: "center" }); cx += colSr;
    doc.text("Details", cx, tableY + 4, { width: colDetails, align: "center" }); cx += colDetails;
    doc.text("Net.WT", cx, tableY + 4, { width: colNet, align: "center" }); cx += colNet;
    doc.text("Quantity", cx, tableY + 4, { width: colQty, align: "center" });

    // Helper to draw a block of rows (30 rows capacity)
    function drawRows(startIndex: number, yStart: number) {
      let rowY = yStart;
      let total = { qty: 0, net: 0 };
      doc.font("Helvetica").fontSize(9).fillColor(lightText);
      for (let i = 0; i < 30; i++) {
        const idx = startIndex + i;
        doc.rect(boxX + 8, rowY, boxW - 16, 18).stroke(borderColor);
        let x = boxX + 8;
        if (idx < items.length) {
          const it = items[idx];
          const details = `${it.metallic_name} - ${it.cut_name}`;
          doc.text(String(idx + 1).padStart(2, "0"), x, rowY + 3, { width: colSr, align: "center" }); x += colSr;
          doc.text(details, x + 4, rowY + 3, { width: colDetails - 8 }); x += colDetails;
          doc.text(it.net_wt.toFixed(3), x, rowY + 3, { width: colNet, align: "center" }); x += colNet;
          doc.text(String(it.bob_qty), x, rowY + 3, { width: colQty, align: "center" });
          total.qty += it.bob_qty; total.net += it.net_wt;
        } else {
          // Empty row placeholders
          x += colSr + colDetails + colNet + colQty;
        }
        rowY += 18;
      }
      return { y: rowY, total };
    }

    // First set of 30
    const first = drawRows(0, tableY + 18);
    // Totals for first block
    doc.rect(boxX + 8, first.y, boxW - 16, 18).stroke(borderColor);
    let tx = boxX + 8;
    doc.font("Helvetica-Bold").text("Total", tx, first.y + 3, { width: colSr + colDetails, align: "right" });
    tx += colSr + colDetails;
    doc.text(first.total.net.toFixed(3) + " kg", tx, first.y + 3, { width: colNet, align: "center" });
    tx += colNet;
    doc.text(String(first.total.qty), tx, first.y + 3, { width: colQty, align: "center" });

    // Second header
    const header2Y = first.y + 30;
    doc.rect(boxX + 8, header2Y, boxW - 16, 18).stroke(borderColor);
    doc.font("Helvetica-Bold").fontSize(9).fillColor(lightText);
    cx = boxX + 8;
    doc.text("Sr", cx, header2Y + 4, { width: colSr, align: "center" }); cx += colSr;
    doc.text("Details", cx, header2Y + 4, { width: colDetails, align: "center" }); cx += colDetails;
    doc.text("Net.WT", cx, header2Y + 4, { width: colNet, align: "center" }); cx += colNet;
    doc.text("Quantity", cx, header2Y + 4, { width: colQty, align: "center" });

    // Second set of 30
    const second = drawRows(30, header2Y + 18);
    // Totals for second block
    doc.rect(boxX + 8, second.y, boxW - 16, 18).stroke(borderColor);
    tx = boxX + 8;
    doc.font("Helvetica-Bold").text("Total", tx, second.y + 3, { width: colSr + colDetails, align: "right" });
    tx += colSr + colDetails;
    doc.text(second.total.net.toFixed(3) + " kg", tx, second.y + 3, { width: colNet, align: "center" });
    tx += colNet;
    doc.text(String(second.total.qty), tx, second.y + 3, { width: colQty, align: "center" });

    // Signatures below second block
    const sigY = second.y + 24;
    doc.font("Helvetica").fontSize(9).fillColor(lightText);
    doc.text("Received By (Customer Sign):", boxX + 12, sigY);
    doc.text("Authorized Sign (Samay Jari):", boxX + boxW - 210, sigY, { width: 200, align: "right" });
    doc.text("___________________", boxX + 12, sigY + 16);
    doc.text("___________________", boxX + boxW - 210, sigY + 16, { width: 200, align: "right" });
  }

  // Draw left (ORIGINAL) and right (COPY)
  drawHalf(pageLeft, "ORIGINAL");
  drawHalf(pageLeft + halfWidth + gutter, "COPY");

  doc.end();

  await new Promise<void>((resolve, reject) => {
    writeStream.on("finish", () => resolve());
    writeStream.on("error", reject);
  });

  const relativePath = path.relative(config.projectRoot, absolutePath);
  return { absolutePath, relativePath };
}
