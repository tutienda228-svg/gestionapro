import { z } from "zod";

export const clientSchema = z.object({
  name: z.string().trim().min(2, "El nombre es obligatorio"),
  contactName: z.string().trim().optional().or(z.literal("")),
  email: z.string().trim().email("Correo inválido").optional().or(z.literal("")),
  phone: z.string().trim().optional().or(z.literal("")),
  address: z.string().trim().optional().or(z.literal("")),
  taxId: z.string().trim().optional().or(z.literal("")),
  notes: z.string().trim().optional().or(z.literal("")),
  status: z.enum(["active", "inactive"]).default("active"),
});
export type ClientInput = z.infer<typeof clientSchema>;
