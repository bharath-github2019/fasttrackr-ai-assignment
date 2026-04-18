export type NormalizedHouseholdInput = {
  householdName: string;
  annualIncome?: number;
  netWorth?: number;
  liquidNetWorth?: number;
  expenseRange?: string;
  taxBracket?: string;
  riskTolerance?: string;
  timeHorizonYears?: number;
  notes?: string;
  members: {
    fullName: string;
    dateOfBirth?: string;
    email?: string;
    phone?: string;
    relationship?: string;
    addressLine?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  }[];
  accounts: {
    accountNumber?: string;
    custodian?: string;
    accountType?: string;
    accountValue?: number;
    ownershipDistribution?: string;
  }[];
  banks: {
    bankName?: string;
    accountNumber?: string;
    routingNumber?: string;
  }[];
};

export type AudioEnrichment = {
  householdName?: string;
  updates: Partial<
    Omit<
      NormalizedHouseholdInput,
      "householdName" | "members" | "accounts" | "banks"
    >
  >;
  memberUpdates: NormalizedHouseholdInput["members"];
  accountUpdates: NormalizedHouseholdInput["accounts"];
  bankUpdates: NormalizedHouseholdInput["banks"];
  summary: string;
  confidence: "low" | "medium" | "high";
};
