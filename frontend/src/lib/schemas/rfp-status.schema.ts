import { z } from "zod";

export const RfpStatusSchema = z.enum([
  "PENDING",
  "UNDER_REVIEW",
  "PROPOSAL_SENT",
  "ACCEPTED",
  "REJECTED",
]);

export const UpdateRfpStatusSchema = z.object({
  status: RfpStatusSchema,
});

export type UpdateRfpStatusInput = z.infer<typeof UpdateRfpStatusSchema>;
