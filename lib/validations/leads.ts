import { z } from "zod";

export const LEAD_STAGES = ["nuevo", "contactado", "cotizado", "ganado", "perdido"] as const;

export const leadSchema = z.object({
  name: z.string().trim().min(2, "El nombre es obligatorio"),
  company: z.string().trim().optional().or(z.literal("")),
  contactName: z.string().trim().optional().or(z.literal("")),
  email: z.string().trim().email("Correo inválido").optional().or(z.literal("")),
  phone: z.string().trim().optional().or(z.literal("")),
  source: z.string().trim().optional().or(z.literal("")),
  interest: z.string().trim().optional().or(z.literal("")),
  stage: z.enum(LEAD_STAGES).default("nuevo"),
  expectedValue: z.coerce.number().min(0).optional().nullable(),
  nextFollowUpAt: z.string().trim().optional().or(z.literal("")),
  notes: z.string().trim().optional().or(z.literal("")),
});
export type LeadInput = z.infer<typeof leadSchema>;
