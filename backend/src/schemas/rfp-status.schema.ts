import { RfpStatus } from "@prisma/client";
import { z } from "zod";

export const RfpStatusSchema = z.nativeEnum(RfpStatus);

export const UpdateRfpStatusSchema = z.object({
  status: RfpStatusSchema,
});

export type UpdateRfpStatusInput = z.infer<typeof UpdateRfpStatusSchema>;
