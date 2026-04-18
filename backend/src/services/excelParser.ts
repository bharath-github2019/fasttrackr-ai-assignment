import * as XLSX from "xlsx";
import { NormalizedHouseholdInput } from "../types.js";

const keyMap: Record<string, string[]> = {
  householdName: ["household", "householdname", "family", "clientname"],
  annualIncome: ["income", "annualincome", "householdincome"],
  netWorth: ["networth", "totalnetworth"],
  liquidNetWorth: ["liquidnetworth", "liquidassets"],
  expenseRange: ["expense", "expenses", "expenserange"],
  taxBracket: ["tax", "taxbracket"],
  riskTolerance: ["risk", "risktolerance"],
  timeHorizonYears: ["timehorizon", "horizon", "years"],
  notes: ["note", "notes", "comment"],
  fullName: ["name", "fullname", "membername"],
  dateOfBirth: ["dob", "dateofbirth", "birth"],
  email: ["email", "mail"],
  phone: ["phone", "mobile", "contact"],
  relationship: ["relationship", "relation"],
  addressLine: ["address", "street"],
  city: ["city"],
  state: ["state", "province"],
  postalCode: ["zip", "postal", "pincode"],
  country: ["country"],
  accountNumber: ["accountnumber", "acctnumber", "account"],
  custodian: ["custodian", "institution", "brokerage", "bank"],
  accountType: ["accounttype", "type"],
  accountValue: ["accountvalue", "value", "balance"],
  ownershipDistribution: ["ownership", "distribution"],
  bankName: ["bankname", "bank"],
  routingNumber: ["routing", "routingnumber", "ifsc"]
};

const normalizeHeader = (value: string) =>
  value.toLowerCase().replace(/[^a-z0-9]/g, "");

const findValue = (row: Record<string, unknown>, field: string): unknown => {
  const aliases = keyMap[field] ?? [field];
  const normalizedEntries: [string, unknown][] = Object.entries(row).map(([k, v]) => [
    normalizeHeader(k),
    v
  ]);
  for (const alias of aliases) {
    const target = normalizeHeader(alias);
    const matched = normalizedEntries.find(([k]) => k.includes(target));
    if (matched && matched[1] !== undefined && matched[1] !== null && matched[1] !== "") {
      return matched[1];
    }
  }
  return undefined;
};

const toNumber = (value: unknown): number | undefined => {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = Number(value.replace(/[^0-9.-]/g, ""));
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
};

const toString = (value: unknown): string | undefined => {
  if (value === undefined || value === null) return undefined;
  const str = String(value).trim();
  return str.length ? str : undefined;
};

const maskAccount = (value?: string): string | undefined => {
  if (!value) return undefined;
  const digits = value.replace(/\D/g, "");
  if (digits.length <= 4) return digits;
  return `${"*".repeat(Math.max(0, digits.length - 4))}${digits.slice(-4)}`;
};

export const parseExcelToHouseholds = (buffer: Buffer): NormalizedHouseholdInput[] => {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const grouped = new Map<string, NormalizedHouseholdInput>();

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
      defval: ""
    });

    for (const row of rows) {
      const householdName =
        toString(findValue(row, "householdName")) ?? "Unknown Household";

      if (!grouped.has(householdName)) {
        grouped.set(householdName, {
          householdName,
          annualIncome: toNumber(findValue(row, "annualIncome")),
          netWorth: toNumber(findValue(row, "netWorth")),
          liquidNetWorth: toNumber(findValue(row, "liquidNetWorth")),
          expenseRange: toString(findValue(row, "expenseRange")),
          taxBracket: toString(findValue(row, "taxBracket")),
          riskTolerance: toString(findValue(row, "riskTolerance")),
          timeHorizonYears: toNumber(findValue(row, "timeHorizonYears")),
          notes: toString(findValue(row, "notes")),
          members: [],
          accounts: [],
          banks: []
        });
      }

      const household = grouped.get(householdName)!;

      if (!household.annualIncome) {
        household.annualIncome = toNumber(findValue(row, "annualIncome"));
      }
      if (!household.netWorth) {
        household.netWorth = toNumber(findValue(row, "netWorth"));
      }
      if (!household.liquidNetWorth) {
        household.liquidNetWorth = toNumber(findValue(row, "liquidNetWorth"));
      }

      const fullName = toString(findValue(row, "fullName"));
      if (fullName) {
        household.members.push({
          fullName,
          dateOfBirth: toString(findValue(row, "dateOfBirth")),
          email: toString(findValue(row, "email")),
          phone: toString(findValue(row, "phone")),
          relationship: toString(findValue(row, "relationship")),
          addressLine: toString(findValue(row, "addressLine")),
          city: toString(findValue(row, "city")),
          state: toString(findValue(row, "state")),
          postalCode: toString(findValue(row, "postalCode")),
          country: toString(findValue(row, "country"))
        });
      }

      const acctRaw = toString(findValue(row, "accountNumber"));
      const custodian = toString(findValue(row, "custodian"));
      const accountType = toString(findValue(row, "accountType"));
      const accountValue = toNumber(findValue(row, "accountValue"));
      if (acctRaw || custodian || accountType || accountValue) {
        household.accounts.push({
          accountNumber: maskAccount(acctRaw),
          custodian,
          accountType,
          accountValue,
          ownershipDistribution: toString(findValue(row, "ownershipDistribution"))
        });
      }

      const bankName = toString(findValue(row, "bankName"));
      const bankAcctRaw = toString(findValue(row, "accountNumber"));
      const routingRaw = toString(findValue(row, "routingNumber"));
      if (bankName || bankAcctRaw || routingRaw) {
        household.banks.push({
          bankName,
          accountNumber: maskAccount(bankAcctRaw),
          routingNumber: maskAccount(routingRaw)
        });
      }
    }
  }

  return Array.from(grouped.values());
};
