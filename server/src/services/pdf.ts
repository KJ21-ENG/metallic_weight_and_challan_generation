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
}): Promise<{ absolutePath: string; relativePath: string }> {
  const { challanNo, dateISO, customer, shiftName, items } = options;

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

  const doc = new PDFDocument({ size: "A4", margin: 36 });
  const writeStream = fs.createWriteStream(absolutePath);
  doc.pipe(writeStream);

  // Header
  doc.fontSize(20).text("Delivery Challan", { align: "center" });
  doc.moveDown(0.5);
  doc.rect(36, doc.y, doc.page.width - 72, 70).stroke();
  const left = 44;
  const right = doc.page.width / 2;
  doc.fontSize(10);
  doc.text(`Challan No: ${String(challanNo).padStart(6, "0")}`, left, doc.y + 8);
  doc.text(`Date: ${date.format("DD/MM/YYYY")}`, left, doc.y + 22);
  doc.text(`Shift: ${shiftName}`, left, doc.y + 36);
  doc.text(`Customer: ${customer.name}`, right, doc.y + 8);
  if (customer.address) doc.text(`Address: ${customer.address}`, right, doc.y + 22, { width: doc.page.width - right - 44 });
  if (customer.gstin) doc.text(`GSTIN: ${customer.gstin}`, right, doc.y + 36);
  doc.moveDown(5);

  // Table
  const startX = 36;
  const widths = [20, 90, 70, 80, 70, 60, 60, 50, 55, 55, 55];
  const headers = ["#", "Metallic", "Cut", "Operator", "Helper", "Bob", "Box", "Qty", "Gross", "Tare", "Net"];
  const colXs: number[] = [];
  let x = startX;
  widths.forEach((w) => { colXs.push(x); x += w; });
  colXs.push(x);
  doc.fontSize(11);
  headers.forEach((h, i) => { doc.text(h, colXs[i] + 2, doc.y, { width: (colXs[i+1]-colXs[i])-4 }); });
  doc.moveTo(startX, doc.y + 12).lineTo(x, doc.y + 12).stroke();

  let y = doc.y + 16;
  const totals = { bobQty: 0, gross: 0, tare: 0, net: 0 };
  items.forEach((it) => {
    const cells = [
      String(it.item_index).padStart(2, "0"),
      it.metallic_name,
      it.cut_name,
      it.operator_name,
      it.helper_name || "-",
      it.bob_type_name,
      it.box_type_name,
      String(it.bob_qty),
      it.gross_wt.toFixed(3),
      it.tare_wt.toFixed(3),
      it.net_wt.toFixed(3),
    ];
    cells.forEach((c, i) => { doc.text(c, colXs[i] + 2, y, { width: (colXs[i+1]-colXs[i])-4 }); });
    y += 16;
    totals.bobQty += it.bob_qty; totals.gross += it.gross_wt; totals.tare += it.tare_wt; totals.net += it.net_wt;
  });

  doc.moveTo(startX, y).lineTo(x, y).stroke();
  doc.fontSize(10).text("Totals", colXs[0] + 2, y + 4, { width: (colXs[6]-colXs[0])-4 });
  doc.text(String(totals.bobQty), colXs[7] + 2, y + 4, { width: (colXs[8]-colXs[7])-4 });
  doc.text(totals.gross.toFixed(3), colXs[8] + 2, y + 4, { width: (colXs[9]-colXs[8])-4 });
  doc.text(totals.tare.toFixed(3), colXs[9] + 2, y + 4, { width: (colXs[10]-colXs[9])-4 });
  doc.text(totals.net.toFixed(3), colXs[10] + 2, y + 4);

  doc.end();

  await new Promise<void>((resolve, reject) => {
    writeStream.on("finish", () => resolve());
    writeStream.on("error", reject);
  });

  const relativePath = path.relative(config.projectRoot, absolutePath);
  return { absolutePath, relativePath };
}
