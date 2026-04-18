import { Router } from "express";
import { getHouseholdById, getInsightsSummary, listHouseholds } from "../services/mergeService.js";
export const householdRouter = Router();
householdRouter.get("/", async (_req, res, next) => {
    try {
        res.json(listHouseholds());
    }
    catch (error) {
        next(error);
    }
});
householdRouter.get("/insights/summary", async (_req, res, next) => {
    try {
        res.json(getInsightsSummary());
    }
    catch (error) {
        next(error);
    }
});
householdRouter.get("/:id", async (req, res, next) => {
    try {
        const household = getHouseholdById(req.params.id);
        if (!household) {
            return res.status(404).json({ message: "Household not found" });
        }
        res.json(household);
    }
    catch (error) {
        next(error);
    }
});
