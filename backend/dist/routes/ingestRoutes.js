import { Router } from "express";
import multer from "multer";
import { parseExcelToHouseholds } from "../services/excelParser.js";
import { enrichHouseholdFromAudio, upsertHouseholdFromExcel } from "../services/mergeService.js";
import { transcribeAndExtract } from "../services/audioProcessor.js";
export const ingestRouter = Router();
const upload = multer({ storage: multer.memoryStorage() });
ingestRouter.post("/excel", upload.single("excel"), async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "Missing excel file" });
        }
        const parsed = parseExcelToHouseholds(req.file.buffer);
        const upserted = await Promise.all(parsed.map((item) => upsertHouseholdFromExcel(item)));
        res.json({
            importedHouseholds: upserted.length,
            households: upserted
        });
    }
    catch (error) {
        next(error);
    }
});
ingestRouter.post("/audio/:householdId", upload.single("audio"), async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "Missing audio file" });
        }
        const { transcript, enrichment } = await transcribeAndExtract(req.file.buffer, req.file.originalname);
        await enrichHouseholdFromAudio(req.params.householdId, enrichment, transcript);
        res.json({
            message: "Audio processed and household enriched",
            transcript,
            enrichment
        });
    }
    catch (error) {
        next(error);
    }
});
