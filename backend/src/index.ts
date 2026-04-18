import "dotenv/config";
import express from "express";
import cors from "cors";
import { householdRouter } from "./routes/householdRoutes.js";
import { ingestRouter } from "./routes/ingestRoutes.js";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
	res.json({ ok: true });
});

app.use("/api/households", householdRouter);
app.use("/api/ingest", ingestRouter);

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
	console.error(err);
	res.status(500).json({ message: err.message || "Internal server error" });
});

const port = Number(process.env.PORT || 4000);
app.listen(port, () => {
	console.log(`Backend running on http://localhost:${port}`);
});
