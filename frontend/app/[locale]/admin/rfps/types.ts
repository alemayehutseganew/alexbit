export const RFP_STATUSES = [
  "PENDING",
  "UNDER_REVIEW",
  "PROPOSAL_SENT",
  "ACCEPTED",
  "REJECTED",
] as const;

export type RfpStatus = (typeof RFP_STATUSES)[number];

export type RfpRecord = {
  id: string;
  organization: string;
  contactName: string;
  contactEmail: string;
  phone: string;
  sector: string;
  projectDetails: string;
  budgetRange: string | null;
  timeline: string | null;
  status: RfpStatus;
  createdAt: string;
  tenant: {
    id: string;
    name: string;
  };
};

export function isRfpStatus(value: unknown): value is RfpStatus {
  return (
    typeof value === "string" && RFP_STATUSES.some((status) => status === value)
  );
}

export function isRfpRecord(value: unknown): value is RfpRecord {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const record = value as Record<string, unknown>;
  const tenant = record.tenant;

  return (
    typeof record.id === "string" &&
    typeof record.organization === "string" &&
    typeof record.contactName === "string" &&
    typeof record.contactEmail === "string" &&
    typeof record.phone === "string" &&
    typeof record.sector === "string" &&
    typeof record.projectDetails === "string" &&
    typeof record.createdAt === "string" &&
    isRfpStatus(record.status) &&
    typeof tenant === "object" &&
    tenant !== null &&
    typeof (tenant as Record<string, unknown>).id === "string" &&
    typeof (tenant as Record<string, unknown>).name === "string"
  );
}
