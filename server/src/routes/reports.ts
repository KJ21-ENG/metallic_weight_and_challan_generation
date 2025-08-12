import { Router, Request, Response, NextFunction } from "express";
import { pool } from "../db";

export const reportsRouter = Router();

// Summary totals by Metallic or Cut in a date range
reportsRouter.get("/summary", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { from, to, groupBy } = req.query as { from?: string; to?: string; groupBy?: string };
    if (!groupBy || !["metallic", "cut"].includes(groupBy)) {
      return res.status(400).json({ error: "groupBy must be 'metallic' or 'cut'" });
    }

    const groupField = groupBy === "metallic" ? "metallic_id" : "cut_id";

    const params: any[] = [];
    let where = " where ci.is_deleted=false and c.is_deleted=false";
    if (from) { params.push(from); where += ` and c.date >= $${params.length}`; }
    if (to) { params.push(to); where += ` and c.date <= $${params.length}`; }

    const nameJoin = groupBy === "metallic" ? "join metallics m on m.id = ci.metallic_id" : "join cuts m on m.id = ci.cut_id";

    const sql = `
      select
        ci.${groupField} as group_id,
        m.name as group_name,
        sum(ci.bob_qty) as total_bob_qty,
        round(sum(ci.gross_wt)::numeric, 3) as total_gross,
        round(sum(ci.tare_wt)::numeric, 3) as total_tare,
        round(sum(ci.net_wt)::numeric, 3) as total_net
      from challan_items ci
      join challans c on c.id = ci.challan_id
      ${nameJoin}
      ${where}
      group by ci.${groupField}, m.name
      order by m.name asc
    `;

    const result = await pool.query(sql, params);
    res.json(result.rows);
  } catch (err) { next(err); }
});

// CSV export for the same report
reportsRouter.get("/summary.csv", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { from, to, groupBy } = req.query as { from?: string; to?: string; groupBy?: string };
    req.url = `/api/reports/summary?from=${from || ""}&to=${to || ""}&groupBy=${groupBy || "metallic"}`;
    // crude reuse by performing the same query
    const params: any[] = [];
    const groupField = groupBy === "cut" ? "cut_id" : "metallic_id";
    const nameJoin = groupBy === "cut" ? "join cuts m on m.id = ci.cut_id" : "join metallics m on m.id = ci.metallic_id";
    let where = " where ci.is_deleted=false and c.is_deleted=false";
    if (from) { params.push(from); where += ` and c.date >= $${params.length}`; }
    if (to) { params.push(to); where += ` and c.date <= $${params.length}`; }

    const sql = `
      select m.name as group_name, sum(ci.bob_qty) as total_bob_qty,
        round(sum(ci.gross_wt)::numeric, 3) as total_gross,
        round(sum(ci.tare_wt)::numeric, 3) as total_tare,
        round(sum(ci.net_wt)::numeric, 3) as total_net
      from challan_items ci
      join challans c on c.id = ci.challan_id
      ${nameJoin}
      ${where}
      group by ci.${groupField}, m.name
      order by m.name asc
    `;

    const result = await pool.query(sql, params);
    const rows = result.rows;
    const header = ["Group", "BobQty", "Gross", "Tare", "Net"]; 
    const csv = [header.join(",")].concat(
      rows.map((r) => [r.group_name, r.total_bob_qty, r.total_gross, r.total_tare, r.total_net].join(","))
    ).join("\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=summary.csv");
    res.send(csv);
  } catch (err) { next(err); }
});
