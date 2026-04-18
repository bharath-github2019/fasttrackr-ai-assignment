import { randomUUID } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
const uniqueBy = (items, keyFn) => {
    const map = new Map();
    for (const item of items) {
        map.set(keyFn(item), item);
    }
    return Array.from(map.values());
};
const parseDateOfBirth = (value) => {
    if (!value)
        return null;
    const trimmed = value.trim();
    if (!trimmed)
        return null;
    if (/^\d+(\.\d+)?$/.test(trimmed)) {
        const serial = Number(trimmed);
        if (Number.isFinite(serial)) {
            const excelEpochUtc = Date.UTC(1899, 11, 30);
            const millis = excelEpochUtc + Math.round(serial * 24 * 60 * 60 * 1000);
            const date = new Date(millis);
            return Number.isNaN(date.getTime()) ? null : date;
        }
    }
    const parsed = new Date(trimmed);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
};
const storeDir = join(process.cwd(), "data");
const storePath = join(storeDir, "households.json");
const readStore = () => {
    if (!existsSync(storeDir))
        mkdirSync(storeDir, { recursive: true });
    if (!existsSync(storePath)) {
        writeFileSync(storePath, JSON.stringify({ households: [] }, null, 2), "utf8");
    }
    const content = readFileSync(storePath, "utf8");
    const parsed = JSON.parse(content);
    return {
        households: parsed.households ?? []
    };
};
const writeStore = (store) => {
    if (!existsSync(storeDir))
        mkdirSync(storeDir, { recursive: true });
    writeFileSync(storePath, JSON.stringify(store, null, 2), "utf8");
};
const nowIso = () => new Date().toISOString();
const withCounts = (h) => ({
    ...h,
    memberCount: h.members.length,
    accountCount: h.accounts.length,
    totalAccountValue: h.accounts.reduce((sum, a) => sum + (a.accountValue ?? 0), 0)
});
export const listHouseholds = () => {
    const store = readStore();
    return store.households
        .slice()
        .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1))
        .map(withCounts);
};
export const getHouseholdById = (id) => {
    const store = readStore();
    return store.households.find((h) => h.id === id) ?? null;
};
export const getInsightsSummary = () => {
    const households = readStore().households;
    const incomeExpense = households.map((h) => ({
        household: h.name,
        income: h.annualIncome ?? 0,
        expensesLow: h.expenseRange
            ? Number(h.expenseRange.split("-")[0].replace(/[^0-9.]/g, "")) || 0
            : 0
    }));
    const netWorthBreakdown = households.map((h) => ({
        household: h.name,
        netWorth: h.netWorth ?? 0,
        liquidNetWorth: h.liquidNetWorth ?? 0
    }));
    const accountDistribution = households.flatMap((h) => h.accounts.map((a) => ({
        household: h.name,
        accountType: a.accountType || "Unknown",
        value: a.accountValue ?? 0
    })));
    const membersPerHousehold = households.map((h) => ({
        household: h.name,
        members: h.members.length
    }));
    return {
        totals: {
            households: households.length,
            members: households.reduce((sum, h) => sum + h.members.length, 0),
            assets: households.reduce((sum, h) => sum + h.accounts.reduce((acc, a) => acc + (a.accountValue ?? 0), 0), 0)
        },
        incomeExpense,
        netWorthBreakdown,
        accountDistribution,
        membersPerHousehold
    };
};
export const upsertHouseholdFromExcel = async (input) => {
    const store = readStore();
    const existingIndex = store.households.findIndex((h) => h.name.toLowerCase() === input.householdName.toLowerCase());
    const existing = existingIndex >= 0 ? store.households[existingIndex] : null;
    const base = existing ?? {
        id: randomUUID(),
        name: input.householdName,
        createdAt: nowIso(),
        updatedAt: nowIso(),
        members: [],
        accounts: [],
        banks: [],
        insights: []
    };
    const next = {
        ...base,
        name: input.householdName,
        annualIncome: input.annualIncome ?? base.annualIncome,
        netWorth: input.netWorth ?? base.netWorth,
        liquidNetWorth: input.liquidNetWorth ?? base.liquidNetWorth,
        expenseRange: input.expenseRange ?? base.expenseRange,
        taxBracket: input.taxBracket ?? base.taxBracket,
        riskTolerance: input.riskTolerance ?? base.riskTolerance,
        timeHorizonYears: input.timeHorizonYears ?? base.timeHorizonYears,
        notes: input.notes ?? base.notes,
        updatedAt: nowIso()
    };
    if (input.members.length) {
        const mergedMembers = uniqueBy([...base.members, ...input.members], (m) => `${m.fullName}|${m.dateOfBirth ?? ""}`.toLowerCase());
        next.members = mergedMembers.map((m) => ({
            id: m.id ?? randomUUID(),
            fullName: m.fullName,
            dateOfBirth: parseDateOfBirth(m.dateOfBirth)?.toISOString(),
            email: m.email,
            phone: m.phone,
            relationship: m.relationship,
            addressLine: m.addressLine,
            city: m.city,
            state: m.state,
            postalCode: m.postalCode,
            country: m.country
        }));
    }
    if (input.accounts.length) {
        const mergedAccounts = uniqueBy([...base.accounts, ...input.accounts], (a) => `${a.accountNumberMasked ?? a.accountNumber ?? ""}|${a.custodian ?? ""}`.toLowerCase());
        next.accounts = mergedAccounts.map((a) => ({
            id: a.id ?? randomUUID(),
            accountNumberMasked: a.accountNumberMasked ?? a.accountNumber,
            custodian: a.custodian,
            accountType: a.accountType,
            accountValue: a.accountValue,
            ownershipDistribution: a.ownershipDistribution
        }));
    }
    if (input.banks.length) {
        const mergedBanks = uniqueBy([...base.banks, ...input.banks], (b) => `${b.accountNumberMasked ?? b.accountNumber ?? ""}|${b.bankName ?? ""}`.toLowerCase());
        next.banks = mergedBanks.map((b) => ({
            id: b.id ?? randomUUID(),
            bankName: b.bankName,
            accountNumberMasked: b.accountNumberMasked ?? b.accountNumber,
            routingNumberMasked: b.routingNumberMasked ?? b.routingNumber
        }));
    }
    if (existingIndex >= 0) {
        store.households[existingIndex] = next;
    }
    else {
        store.households.push(next);
    }
    writeStore(store);
    return next;
};
export const enrichHouseholdFromAudio = async (householdId, enrichment, transcript) => {
    const store = readStore();
    const idx = store.households.findIndex((h) => h.id === householdId);
    if (idx < 0) {
        throw new Error("Household not found");
    }
    const existing = store.households[idx];
    const next = {
        ...existing,
        annualIncome: enrichment.updates.annualIncome ?? existing.annualIncome,
        netWorth: enrichment.updates.netWorth ?? existing.netWorth,
        liquidNetWorth: enrichment.updates.liquidNetWorth ?? existing.liquidNetWorth,
        expenseRange: enrichment.updates.expenseRange ?? existing.expenseRange,
        taxBracket: enrichment.updates.taxBracket ?? existing.taxBracket,
        riskTolerance: enrichment.updates.riskTolerance ?? existing.riskTolerance,
        timeHorizonYears: enrichment.updates.timeHorizonYears ?? existing.timeHorizonYears,
        notes: [existing.notes, enrichment.updates.notes].filter(Boolean).join("\n"),
        updatedAt: nowIso()
    };
    const allMembers = uniqueBy([...existing.members, ...enrichment.memberUpdates], (m) => `${m.fullName}|${m.dateOfBirth ?? ""}`.toLowerCase());
    next.members = allMembers.map((m) => ({
        id: m.id ?? randomUUID(),
        fullName: m.fullName,
        dateOfBirth: parseDateOfBirth(m.dateOfBirth)?.toISOString(),
        email: m.email,
        phone: m.phone,
        relationship: m.relationship,
        addressLine: m.addressLine,
        city: m.city,
        state: m.state,
        postalCode: m.postalCode,
        country: m.country
    }));
    const allAccounts = uniqueBy([...existing.accounts, ...enrichment.accountUpdates], (a) => `${a.accountNumberMasked ?? a.accountNumber ?? ""}|${a.custodian ?? ""}`.toLowerCase());
    next.accounts = allAccounts.map((a) => ({
        id: a.id ?? randomUUID(),
        accountNumberMasked: a.accountNumberMasked ?? a.accountNumber,
        custodian: a.custodian,
        accountType: a.accountType,
        accountValue: a.accountValue,
        ownershipDistribution: a.ownershipDistribution
    }));
    const allBanks = uniqueBy([...existing.banks, ...enrichment.bankUpdates], (b) => `${b.accountNumberMasked ?? b.accountNumber ?? ""}|${b.bankName ?? ""}`.toLowerCase());
    next.banks = allBanks.map((b) => ({
        id: b.id ?? randomUUID(),
        bankName: b.bankName,
        accountNumberMasked: b.accountNumberMasked ?? b.accountNumber,
        routingNumberMasked: b.routingNumberMasked ?? b.routingNumber
    }));
    next.insights = [
        ...existing.insights,
        {
            id: randomUUID(),
            source: "audio",
            summary: enrichment.summary,
            rawJson: JSON.stringify({ enrichment, transcript }),
            createdAt: nowIso()
        }
    ];
    store.households[idx] = next;
    writeStore(store);
};
