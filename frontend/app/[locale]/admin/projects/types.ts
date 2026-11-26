export type AdminProjectRecord = {
  id: string;
  title: string;
  description: string;
  status: string;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
  tenant: {
    id: string;
    name: string;
  };
};

export function isAdminProjectRecord(
  value: unknown,
): value is AdminProjectRecord {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const record = value as Record<string, unknown>;
  const tenant = record.tenant;

  return (
    typeof record.id === "string" &&
    typeof record.title === "string" &&
    typeof record.description === "string" &&
    typeof record.status === "string" &&
    (record.startDate === null || typeof record.startDate === "string") &&
    (record.endDate === null || typeof record.endDate === "string") &&
    typeof record.createdAt === "string" &&
    typeof tenant === "object" &&
    tenant !== null &&
    typeof (tenant as Record<string, unknown>).id === "string" &&
    typeof (tenant as Record<string, unknown>).name === "string"
  );
}
