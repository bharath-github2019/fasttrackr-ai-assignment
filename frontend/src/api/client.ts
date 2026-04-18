export type HouseholdSummary = {
  id: string;
  name: string;
  annualIncome?: number;
  netWorth?: number;
  expenseRange?: string;
  taxBracket?: string;
  riskTolerance?: string;
  memberCount: number;
  accountCount: number;
  totalAccountValue: number;
  updatedAt: string;
};

export type HouseholdDetail = HouseholdSummary & {
  liquidNetWorth?: number;
  notes?: string;
  members: {
    id: string;
    fullName: string;
    dateOfBirth?: string;
    relationship?: string;
    email?: string;
    phone?: string;
    addressLine?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  }[];
  accounts: {
    id: string;
    accountNumberMasked?: string;
    custodian?: string;
    accountType?: string;
    accountValue?: number;
    ownershipDistribution?: string;
  }[];
  banks: {
    id: string;
    bankName?: string;
    accountNumberMasked?: string;
    routingNumberMasked?: string;
  }[];
  insights: {
    id: string;
    source: string;
    summary?: string;
    createdAt: string;
  }[];
};

export type InsightPayload = {
  totals: {
    households: number;
    members: number;
    assets: number;
  };
  incomeExpense: { household: string; income: number; expensesLow: number }[];
  netWorthBreakdown: {
    household: string;
    netWorth: number;
    liquidNetWorth: number;
  }[];
  accountDistribution: {
    household: string;
    accountType: string;
    value: number;
  }[];
  membersPerHousehold: { household: string; members: number }[];
};

const readJson = async <T>(path: string): Promise<T> => {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }
  return response.json() as Promise<T>;
};

export const getHouseholds = () => readJson<HouseholdSummary[]>("/api/households");
export const getHousehold = (id: string) =>
  readJson<HouseholdDetail>(`/api/households/${id}`);
export const getInsights = () =>
  readJson<InsightPayload>("/api/households/insights/summary");

export const uploadExcel = async (file: File) => {
  const formData = new FormData();
  formData.append("excel", file);
  const response = await fetch("/api/ingest/excel", {
    method: "POST",
    body: formData
  });
  if (!response.ok) {
    let message = "Excel upload failed";
    try {
      const payload = (await response.json()) as { message?: string };
      if (payload?.message) message = `Excel upload failed: ${payload.message}`;
    } catch {
      const text = await response.text();
      if (text) message = `Excel upload failed: ${text}`;
    }
    throw new Error(message);
  }
  return response.json();
};

export const uploadAudio = async (householdId: string, file: File) => {
  const formData = new FormData();
  formData.append("audio", file);
  const response = await fetch(`/api/ingest/audio/${householdId}`, {
    method: "POST",
    body: formData
  });
  if (!response.ok) {
    let message = "Audio upload failed";
    try {
      const payload = (await response.json()) as { message?: string };
      if (payload?.message) message = `Audio upload failed: ${payload.message}`;
    } catch {
      const text = await response.text();
      if (text) message = `Audio upload failed: ${text}`;
    }
    throw new Error(message);
  }
  return response.json();
};
