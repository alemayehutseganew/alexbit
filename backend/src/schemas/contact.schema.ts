import { z } from "zod";

export const ContactSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(254),
  phone: z.string().trim().min(7).max(24),
  subject: z.enum(["GENERAL", "PARTNERSHIP", "SUPPORT", "MEDIA"]),
  message: z.string().trim().min(20).max(4000),
});

export type ContactInput = z.infer<typeof ContactSchema>;
