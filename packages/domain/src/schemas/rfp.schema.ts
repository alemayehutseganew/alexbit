import { z } from "zod";

export const SectorEnum = z.enum([
  "EDUCATION",
  "IT_SUPPORT",
  "WEB_SOFTWARE",
  "TELECOM",
  "SOLAR_ELECTRICAL",
  "POWER_GEN",
]);

export const RfpSchema = z.object({
  organization: z.string().min(2, "Organization name is required"),
  contactName: z.string().min(2, "Contact name is required"),
  contactEmail: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Valid phone number is required"),
  sector: SectorEnum,
  projectDetails: z
    .string()
    .min(50, "Please provide at least 50 characters of detail"),
  budgetRange: z.string().optional(),
  timeline: z.string().optional(),
});

export type RfpInput = z.infer<typeof RfpSchema>;
