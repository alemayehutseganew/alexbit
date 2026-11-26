import { z } from "zod";

const emailSchema = z.string().trim().email().toLowerCase();

export const LoginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1),
});

const registerFieldsSchema = z.object({
  firstName: z.string().trim().min(1),
  lastName: z.string().trim().min(1),
  organization: z.string().trim().min(1),
  email: emailSchema,
  password: z.string().min(8),
});

export const RegisterSchema = registerFieldsSchema
  .extend({
    confirmPassword: z.string(),
    acceptTerms: z.boolean().refine((accepted) => accepted, {
      message: "You must accept the terms and conditions.",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export const RegisterApiSchema = registerFieldsSchema;

export const ForgotPasswordSchema = z.object({
  email: emailSchema,
});

export const ResetPasswordSchema = z.object({
  token: z.string().min(1),
  newPassword: z.string().min(8),
});

export type LoginInput = z.infer<typeof LoginSchema>;
export type RegisterInput = z.infer<typeof RegisterSchema>;
export type RegisterApiInput = z.infer<typeof RegisterApiSchema>;
export type ForgotPasswordInput = z.infer<typeof ForgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>;
