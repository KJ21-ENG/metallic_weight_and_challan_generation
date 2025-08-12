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

  const doc = new PDFDocument({ size: "A4", margin: 40 });
  const writeStream = fs.createWriteStream(absolutePath);
  doc.pipe(writeStream);

  doc.fontSize(18).text("Delivery Challan", { align: "center" });
  doc.moveDown(0.5);

  doc.fontSize(10);
  doc.text(`Challan No: ${String(challanNo).padStart(6, "0")}`);
  doc.text(`Date: ${date.format("DD/MM/YYYY")}`);
  doc.text(`Shift: ${shiftName}`);
  doc.moveDown(0.5);

  doc.text(`Customer: ${customer.name}`);
  if (customer.address) doc.text(`Address: ${customer.address}`);
  if (customer.gstin) doc.text(`GSTIN: ${customer.gstin}`);

  doc.moveDown(1);

  // Table header
  doc.fontSize(10).text(
    "#  Metallic  Cut  Operator  Helper  BobType  BoxType  BobQty  Gross  Tare  Net",
    { continued: false }
  );
  doc.moveTo(doc.x, doc.y).lineTo(550, doc.y).stroke();

  items.forEach((it) => {
    const row = [
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
    ].join("  ");
    doc.text(row);
  });

  const totals = items.reduce(
    (acc, it) => {
      acc.bobQty += it.bob_qty;
      acc.gross += it.gross_wt;
      acc.tare += it.tare_wt;
      acc.net += it.net_wt;
      return acc;
    },
    { bobQty: 0, gross: 0, tare: 0, net: 0 }
  );

  doc.moveDown(0.5);
  doc.text(
    `Totals -> BobQty: ${totals.bobQty}  Gross: ${totals.gross.toFixed(3)}  Tare: ${totals.tare.toFixed(3)}  Net: ${totals.net.toFixed(3)}`
  );

  doc.end();

  await new Promise<void>((resolve, reject) => {
    writeStream.on("finish", () => resolve());
    writeStream.on("error", reject);
  });

  const relativePath = path.relative(config.projectRoot, absolutePath);
  return { absolutePath, relativePath };
}
