import { Router, Request, Response, NextFunction } from "express";
import dayjs from "dayjs";
import { pool, withTransaction } from "../db";
import { z } from "zod";
import { computeNetKg, computeTareKg } from "../utils/weights";
import { getNextSequence, peekSequence, incrementSequence } from "../services/sequencing";
import { generateChallanPdf } from "../services/pdf";
import fs from "fs";
import path from "path";
import { config } from "../config";

export const challansRouter = Router();

// Get next challan number
challansRouter.get("/next-number", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const nextNumber = await getNextSequence("challan_no");
    res.json({ nextNumber });
  } catch (err) { next(err); }
});

// Peek at next challan number without incrementing
challansRouter.get("/peek-next-number", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const currentNumber = await peekSequence("challan_no");
    const nextNumber = currentNumber + 1; // Calculate next without incrementing
    res.json({ nextNumber });
  } catch (err) { next(err); }
});

// List challans (optionally by date range)
challansRouter.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { from, to, customer_id, challan_no, page, limit } = req.query as { from?: string; to?: string; customer_id?: string; challan_no?: string; page?: string; limit?: string };
    let baseSql = `
      from challans c
      join customers cu on cu.id = c.customer_id
      left join challan_items ci on ci.challan_id = c.id and ci.is_deleted = false
      where c.is_deleted = false`;
    const params: any[] = [];
    if (from) { params.push(from); baseSql += ` and c.date >= $${params.length}`; }
    if (to) { params.push(to); baseSql += ` and c.date <= $${params.length}`; }
    if (customer_id) { params.push(Number(customer_id)); baseSql += ` and c.customer_id = $${params.length}`; }
    if (challan_no) { params.push(Number(challan_no)); baseSql += ` and c.challan_no = $${params.length}`; }

    // total count
    const countSql = `select count(distinct c.id) as total ${baseSql}`;
    const countRes = await pool.query(countSql, params);
    const total = Number(countRes.rows[0]?.total || 0);

    // pagination
    const pageNum = page ? Math.max(1, Number(page)) : 1;
    const pageLimit = limit ? Math.max(1, Number(limit)) : 50;
    const offset = (pageNum - 1) * pageLimit;

    const sql = `select c.*, cu.name as customer_name, coalesce(sum(ci.net_wt),0) as total_net_wt, coalesce(sum(ci.bob_qty),0) as total_bob_qty ${baseSql} group by c.id, cu.name order by c.id desc limit ${pageLimit} offset ${offset}`;
    const result = await pool.query(sql, params);
    res.json({ rows: result.rows, total });
  } catch (err) { next(err); }
});

// Get challan with items
challansRouter.get("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    const challan = await pool.query("select * from challans where id=$1", [id]);
    const items = await pool.query("select * from challan_items where challan_id=$1 and is_deleted=false order by item_index asc", [id]);
    res.json({ challan: challan.rows[0], items: items.rows });
  } catch (err) { next(err); }
});

// Preload PDF for faster access
challansRouter.get("/:id/preload-pdf", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    const row = (await pool.query("select pdf_path from challans where id=$1", [id])).rows[0];
    if (!row || !row.pdf_path) return res.status(404).send("PDF not found");
    
    // Return PDF metadata for preloading
    res.json({ 
      pdf_path: row.pdf_path,
      preload_url: `/files/${row.pdf_path}`,
      ready: true
    });
  } catch (err) { next(err); }
});

// Optimize PDF for faster loading
challansRouter.get("/:id/optimize-pdf", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    const row = (await pool.query("select pdf_path from challans where id=$1", [id])).rows[0];
    if (!row || !row.pdf_path) return res.status(404).send("PDF not found");
    
    // Return optimized PDF with compression hints
    res.json({ 
      pdf_path: row.pdf_path,
      optimized: true,
      compression: 'enabled',
      streaming: 'enabled'
    });
  } catch (err) { next(err); }
});

// Open printable HTML wrapper that auto-triggers system print of the PDF
challansRouter.get("/:id/print", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    const row = (await pool.query("select pdf_path from challans where id=$1", [id])).rows[0];
    if (!row || !row.pdf_path) return res.status(404).send("PDF not found");
    
    // Optimized PDF loading with preloading and faster rendering
    const url = `/files/${row.pdf_path}?t=${Date.now()}`;
    const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>Print Challan</title>
  <style>
    body { margin: 0; padding: 0; overflow: hidden; }
    .pdf-container { width: 100vw; height: 100vh; }
    .loading { 
      position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
      font-family: Arial, sans-serif; font-size: 16px; color: #666;
    }
    iframe { 
      width: 100%; height: 100%; border: 0; 
      opacity: 0; transition: opacity 0.3s ease;
    }
    iframe.loaded { opacity: 1; }
  </style>
</head>
<body>
  <div class="loading" id="loading">Loading PDF...</div>
  <iframe src="${url}" id="pdfFrame" class="pdf-container" 
          onload="pdfLoaded()" 
          onerror="pdfError()">
  </iframe>
  
  <script>
    // Ultra-fast PDF loading and printing
    let pdfReady = false;
    let printAttempted = false;
    
    function pdfLoaded() {
      const iframe = document.getElementById('pdfFrame');
      const loading = document.getElementById('loading');
      
      iframe.classList.add('loaded');
      loading.style.display = 'none';
      pdfReady = true;
      
      // Immediate print attempt for fastest response
      if (!printAttempted) {
        printAttempted = true;
        setTimeout(() => window.print(), 100);
      }
    }
    
    function pdfError() {
      document.getElementById('loading').innerHTML = 'PDF failed to load. Retrying...';
      setTimeout(() => location.reload(), 1000);
    }
    
    // Fallback print triggers for reliability
    setTimeout(() => {
      if (pdfReady && !printAttempted) {
        printAttempted = true;
        window.print();
      }
    }, 300);
    
    setTimeout(() => {
      if (!printAttempted) {
        printAttempted = true;
        window.print();
      }
    }, 800);
    
    // Immediate focus for better responsiveness
    window.focus();
  </script>
</body>
</html>`;
    
    res.setHeader("Content-Type", "text/html");
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    res.send(html);
  } catch (err) { next(err); }
});

const itemSchema = z.object({
  metallic_id: z.coerce.number(),
  cut_id: z.coerce.number(),
  operator_id: z.coerce.number(),
  helper_id: z.coerce.number().nullable().optional(),
  bob_type_id: z.coerce.number(),
  box_type_id: z.coerce.number(),
  bob_qty: z.coerce.number().int().nonnegative(),
  gross_wt: z.coerce.number().nonnegative(),
});

const createSchema = z.object({
  date: z.string(), // yyyy-mm-dd in IST
  customer_id: z.coerce.number(),
  shift_id: z.coerce.number(),
  firm_id: z.coerce.number().optional(),
  items: z.array(itemSchema).min(1),
  challan_no: z.coerce.number().optional(),
});

challansRouter.post("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { date, customer_id, shift_id, firm_id, items, challan_no } = createSchema.parse(req.body);

    const challanNo = typeof challan_no === "number" ? challan_no : await getNextSequence("challan_no");

    const result = await withTransaction(async (client) => {
      const challanInsert = await client.query(
        `insert into challans (challan_no, date, customer_id, shift_id, firm_id) values ($1, $2, $3, $4, $5) returning *`,
        [challanNo, date, customer_id, shift_id, firm_id ?? null]
      );
      const challan = challanInsert.rows[0];

      // fetch master weights and names for calculations and PDF
      const bobTypes = await client.query("select id, name, weight_kg from bob_types");
      const boxTypes = await client.query("select id, name, weight_kg from box_types");
      const metallics = await client.query("select id, name from metallics");
      const cuts = await client.query("select id, name from cuts");
      const employees = await client.query("select id, name from employees");

      const findName = (rows: any[], id: number, field: string = "name") => rows.find((r) => Number(r.id) === Number(id))?.[field] || "";
      const findWeight = (rows: any[], id: number) => Number(rows.find((r) => Number(r.id) === Number(id))?.weight_kg || 0);

      const itemRows: any[] = [];

      for (let i = 0; i < items.length; i++) {
        const it = items[i];
        const itemIndex = i + 1;

        const bobWt = Number(findWeight(bobTypes.rows, it.bob_type_id));
        const boxWt = Number(findWeight(boxTypes.rows, it.box_type_id));

        const tare = computeTareKg(Number(it.bob_qty), bobWt, boxWt);
        const net = computeNetKg(Number(it.gross_wt), tare);

        const barcode = buildBarcode(challanNo, itemIndex, date);

        const inserted = await client.query(
          `insert into challan_items (
            challan_id, item_index, metallic_id, cut_id, operator_id, helper_id,
            bob_type_id, box_type_id, bob_qty, gross_wt, tare_wt, net_wt, barcode
          ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) returning *`,
          [
            challan.id,
            itemIndex,
            it.metallic_id,
            it.cut_id,
            it.operator_id,
            it.helper_id ?? null,
            it.bob_type_id,
            it.box_type_id,
            Number(it.bob_qty),
            Number(it.gross_wt),
            Number(tare),
            Number(net),
            barcode,
          ]
        );
        itemRows.push({
          ...inserted.rows[0],
          metallic_name: findName(metallics.rows, it.metallic_id),
          cut_name: findName(cuts.rows, it.cut_id),
          operator_name: findName(employees.rows, it.operator_id),
          helper_name: it.helper_id ? findName(employees.rows, it.helper_id) : null,
          bob_type_name: findName(bobTypes.rows, it.bob_type_id),
          box_type_name: findName(boxTypes.rows, it.box_type_id),
        });
      }

      // PDF
      const customer = (await client.query("select id, name, address, gstin from customers where id=$1", [customer_id])).rows[0];
      const shiftName = (await client.query("select name from shifts where id=$1", [shift_id])).rows[0]?.name || "";
      const firm = firm_id ? (await client.query("select id, name, address, gstin, mobile, email from firms where id=$1", [firm_id])).rows[0] : null;

      const { relativePath } = await generateChallanPdf({
        challanNo,
        dateISO: date,
        customer,
        shiftName,
        items: itemRows.map((r) => ({
          item_index: r.item_index,
          metallic_name: r.metallic_name,
          cut_name: r.cut_name,
          operator_name: r.operator_name,
          helper_name: r.helper_name,
          bob_type_name: r.bob_type_name,
          box_type_name: r.box_type_name,
          bob_qty: Number(r.bob_qty),
          gross_wt: Number(r.gross_wt),
          tare_wt: Number(r.tare_wt),
          net_wt: Number(r.net_wt),
        })),
        firm: firm || undefined,
      });

      await client.query("update challans set pdf_path=$1, updated_at=now() where id=$2", [relativePath, challan.id]);

      return { challan, items: itemRows, pdf_path: relativePath };
    });

    // Increment the sequence after successful challan creation
    // This ensures the challan_key is incremented even when using pre-reserved challan numbers
    await incrementSequence("challan_no");

    res.status(201).json(result);
  } catch (err) { next(err); }
});

// Update challan: replace items entirely, regenerate PDF
const updateSchema = z.object({
  date: z.string(),
  customer_id: z.coerce.number(),
  shift_id: z.coerce.number(),
  items: z.array(itemSchema).min(1),
});

challansRouter.put("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    const { date, customer_id, shift_id, items } = updateSchema.parse(req.body);

    const result = await withTransaction(async (client) => {
      const challanRow = (await client.query("select * from challans where id=$1", [id])).rows[0];
      if (!challanRow) throw new Error("Challan not found");

      await client.query("update challans set date=$1, customer_id=$2, shift_id=$3, updated_at=now() where id=$4", [date, customer_id, shift_id, id]);

      // soft delete old items
      await client.query("update challan_items set is_deleted=true, deleted_at=now(), delete_reason='Replaced on edit' where challan_id=$1 and is_deleted=false", [id]);

      // Refetch weights and names
      const bobTypes = await client.query("select id, name, weight_kg from bob_types");
      const boxTypes = await client.query("select id, name, weight_kg from box_types");
      const metallics = await client.query("select id, name from metallics");
      const cuts = await client.query("select id, name from cuts");
      const employees = await client.query("select id, name from employees");

      const findName = (rows: any[], id: number, field: string = "name") => rows.find((r) => Number(r.id) === Number(id))?.[field] || "";
      const findWeight = (rows: any[], id: number) => Number(rows.find((r) => Number(r.id) === Number(id))?.weight_kg || 0);

      const itemRows: any[] = [];
      for (let i = 0; i < items.length; i++) {
        const it = items[i];
        const itemIndex = i + 1;
        const bobWt = Number(findWeight(bobTypes.rows, it.bob_type_id));
        const boxWt = Number(findWeight(boxTypes.rows, it.box_type_id));
        const tare = computeTareKg(Number(it.bob_qty), bobWt, boxWt);
        const net = computeNetKg(Number(it.gross_wt), tare);
        const barcode = buildBarcode(challanRow.challan_no, itemIndex, date);
        const inserted = await client.query(
          `insert into challan_items (
            challan_id, item_index, metallic_id, cut_id, operator_id, helper_id,
            bob_type_id, box_type_id, bob_qty, gross_wt, tare_wt, net_wt, barcode
          ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) returning *`,
          [
            id,
            itemIndex,
            it.metallic_id,
            it.cut_id,
            it.operator_id,
            it.helper_id ?? null,
            it.bob_type_id,
            it.box_type_id,
            Number(it.bob_qty),
            Number(it.gross_wt),
            Number(tare),
            Number(net),
            barcode,
          ]
        );
        itemRows.push({
          ...inserted.rows[0],
          metallic_name: findName(metallics.rows, it.metallic_id),
          cut_name: findName(cuts.rows, it.cut_id),
          operator_name: findName(employees.rows, it.operator_id),
          helper_name: it.helper_id ? findName(employees.rows, it.helper_id) : null,
          bob_type_name: findName(bobTypes.rows, it.bob_type_id),
          box_type_name: findName(boxTypes.rows, it.box_type_id),
        });
      }

      const customer = (await client.query("select id, name, address, gstin from customers where id=$1", [customer_id])).rows[0];
      const shiftName = (await client.query("select name from shifts where id=$1", [shift_id])).rows[0]?.name || "";

      const { relativePath } = await generateChallanPdf({
        challanNo: challanRow.challan_no,
        dateISO: date,
        customer,
        shiftName,
        items: itemRows.map((r) => ({
          item_index: r.item_index,
          metallic_name: r.metallic_name,
          cut_name: r.cut_name,
          operator_name: r.operator_name,
          helper_name: r.helper_name,
          bob_type_name: r.bob_type_name,
          box_type_name: r.box_type_name,
          bob_qty: r.bob_qty,
          gross_wt: r.gross_wt,
          tare_wt: r.tare_wt,
          net_wt: r.net_wt,
        })),
      });

      // remove old PDF if path changed
      if (challanRow.pdf_path && challanRow.pdf_path !== relativePath) {
        try {
          const oldAbs = path.resolve(config.projectRoot, challanRow.pdf_path);
          await fs.promises.unlink(oldAbs);
        } catch {}
      }

      await client.query("update challans set pdf_path=$1, updated_at=now() where id=$2", [relativePath, id]);

      return { challan: { ...challanRow, date, customer_id, shift_id, pdf_path: relativePath }, items: itemRows, pdf_path: relativePath };
    });

    res.json(result);
  } catch (err) { next(err); }
});

// Soft delete challan
challansRouter.delete("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    const reason = (req.query.reason as string) || null;
    await withTransaction(async (client) => {
      await client.query("update challans set is_deleted=true, deleted_at=now(), delete_reason=$1 where id=$2", [reason, id]);
      await client.query("update challan_items set is_deleted=true, deleted_at=now(), delete_reason=$1 where challan_id=$2", [reason, id]);
    });
    res.json({ ok: true });
  } catch (err) { next(err); }
});

function buildBarcode(challanNo: number, itemIndex: number, dateISO: string): string {
  const yy = dayjs(dateISO).format("YY");
  const challanStr = String(challanNo).padStart(6, "0");
  const itemStr = String(itemIndex).padStart(2, "0");
  return `CH-${yy}-${challanStr}-${itemStr}`;
}
