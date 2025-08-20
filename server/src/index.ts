import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import path from "path";
import { config } from "./config";
import { masterRouter } from "./routes/master";
import { challansRouter } from "./routes/challans";
// reportsRouter removed as Reports module deleted

const app = express();
app.use(cors());
app.use(express.json());

// Static serve challan PDFs with no-cache to always fetch latest generated files
app.use(
  "/files/Challans",
  (_req, res, next) => {
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    next();
  },
  express.static(path.join(config.projectRoot, "Challans"))
);

app.use("/api/master", masterRouter);
app.use("/api/challans", challansRouter);

// Health
app.get("/api/health", (_req: Request, res: Response) => res.json({ ok: true }));

// Error handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  // eslint-disable-next-line no-console
  console.error(err);
  res.status(500).json({ error: err.message || "Internal Server Error" });
});

app.listen(config.port, () => {
  // eslint-disable-next-line no-console
  console.log(`Server listening on port ${config.port}`);
});
