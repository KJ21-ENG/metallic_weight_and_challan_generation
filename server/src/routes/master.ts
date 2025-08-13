import { Router, Request, Response, NextFunction } from "express";
import { pool } from "../db";
import { z } from "zod";

export const masterRouter = Router();

// Generic GET for dropdowns
masterRouter.get("/:type", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { type } = req.params;
    const table = resolveTable(type);
    let sql = `select * from ${table} where is_active = true order by name asc`;
    if (table === "bob_types" || table === "box_types") {
      sql = `select id, name, (weight_kg)::float8 as weight_kg, is_active, created_at, updated_at, deleted_at, delete_reason from ${table} where is_active = true order by name asc`;
    } else if (table === "employees") {
      sql = `select id, name, role_operator, role_helper, is_active, created_at, updated_at, deleted_at, delete_reason from employees where is_active = true order by name asc`;
    } else if (table === "customers") {
      sql = `select id, name, address, gstin, is_active, created_at, updated_at, deleted_at, delete_reason from customers where is_active = true order by name asc`;
    }
    const result = await pool.query(sql);
    res.json(result.rows);
  } catch (err) { next(err); }
});

// Create
masterRouter.post("/:type", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { type } = req.params;
    const table = resolveTable(type);

    if (table === "bob_types" || table === "box_types") {
      const schema = z.object({ name: z.string().min(1), weight_kg: z.number().nonnegative() });
      const { name, weight_kg } = schema.parse(req.body);
      const result = await pool.query(
        `insert into ${table} (name, weight_kg) values ($1, $2) returning *`,
        [name.trim(), weight_kg]
      );
      return res.status(201).json(result.rows[0]);
    }

    if (table === "employees") {
      const schema = z.object({ name: z.string().min(1), role_operator: z.boolean().optional(), role_helper: z.boolean().optional() });
      const { name, role_operator = false, role_helper = false } = schema.parse(req.body);
      const result = await pool.query(
        `insert into employees (name, role_operator, role_helper) values ($1, $2, $3) returning *`,
        [name.trim(), role_operator, role_helper]
      );
      return res.status(201).json(result.rows[0]);
    }

    if (table === "customers") {
      const schema = z.object({ name: z.string().min(1), address: z.string().optional(), gstin: z.string().optional() });
      const { name, address = null, gstin = null } = schema.parse(req.body);
      const result = await pool.query(
        `insert into customers (name, address, gstin) values ($1, $2, $3) returning *`,
        [name.trim(), address, gstin]
      );
      return res.status(201).json(result.rows[0]);
    }

    // defaults: metallics, cuts, shifts
    const schema = z.object({ name: z.string().min(1) });
    const { name } = schema.parse(req.body);
    const result = await pool.query(
      `insert into ${table} (name) values ($1) returning *`,
      [name.trim()]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { next(err); }
});

// Update by id
masterRouter.put("/:type/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { type, id } = req.params;
    const table = resolveTable(type);

    if (table === "bob_types" || table === "box_types") {
      const schema = z.object({ name: z.string().min(1), weight_kg: z.number().nonnegative() });
      const { name, weight_kg } = schema.parse(req.body);
      const result = await pool.query(
        `update ${table} set name=$1, weight_kg=$2, updated_at=now() where id=$3 returning *`,
        [name.trim(), weight_kg, id]
      );
      return res.json(result.rows[0]);
    }

    if (table === "employees") {
      const schema = z.object({ name: z.string().min(1), role_operator: z.boolean().optional(), role_helper: z.boolean().optional() });
      const { name, role_operator = false, role_helper = false } = schema.parse(req.body);
      const result = await pool.query(
        `update employees set name=$1, role_operator=$2, role_helper=$3, updated_at=now() where id=$4 returning *`,
        [name.trim(), role_operator, role_helper, id]
      );
      return res.json(result.rows[0]);
    }

    if (table === "customers") {
      const schema = z.object({ name: z.string().min(1), address: z.string().optional(), gstin: z.string().optional() });
      const { name, address = null, gstin = null } = schema.parse(req.body);
      const result = await pool.query(
        `update customers set name=$1, address=$2, gstin=$3, updated_at=now() where id=$4 returning *`,
        [name.trim(), address, gstin, id]
      );
      return res.json(result.rows[0]);
    }

    const schema = z.object({ name: z.string().min(1) });
    const { name } = schema.parse(req.body);
    const result = await pool.query(
      `update ${table} set name=$1, updated_at=now() where id=$2 returning *`,
      [name.trim(), id]
    );
    res.json(result.rows[0]);
  } catch (err) { next(err); }
});

// Soft delete
masterRouter.delete("/:type/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { type, id } = req.params;
    const table = resolveTable(type);
    const reason = (req.query.reason as string) || null;
    const result = await pool.query(
      `update ${table} set is_active=false, deleted_at=now(), delete_reason=$1 where id=$2 returning *`,
      [reason, id]
    );
    res.json(result.rows[0]);
  } catch (err) { next(err); }
});

function resolveTable(type: string): string {
  switch (type) {
    case "metallic":
    case "metallics":
      return "metallics";
    case "cut":
    case "cuts":
      return "cuts";
    case "employees":
    case "employee":
      return "employees";
    case "bobTypes":
    case "bob_types":
      return "bob_types";
    case "boxTypes":
    case "box_types":
      return "box_types";
    case "customers":
    case "customer":
      return "customers";
    case "shifts":
    case "shift":
      return "shifts";
    default:
      throw new Error("Unknown master type");
  }
}
