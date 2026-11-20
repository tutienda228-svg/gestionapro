import { z } from "zod";

export const quotationItemSchema = z.object({
  description: z.string().trim().min(1, "Describe el ítem"),
  quantity: z.coerce.number().min(0.01, "Cantidad inválida"),
  unit: z.string().trim().optional().or(z.literal("")),
  unitPrice: z.coerce.number().min(0, "Precio inválido"),
});
export type QuotationItemInput = z.infer<typeof quotationItemSchema>;

export const quotationSchema = z.object({
  clientId: z.string().uuid("Selecciona un cliente"),
  leadId: z.string().optional().nullable(),
  title: z.string().trim().min(2, "El título es obligatorio"),
  description: z.string().trim().optional().or(z.literal("")),
  taxRate: z.coerce.number().min(0).max(100).default(0),
  discountAmount: z.coerce.number().min(0).default(0),
  validUntil: z.string().optional().or(z.literal("")),
  items: z.array(quotationItemSchema).min(1, "Agrega al menos un ítem"),
});
export type QuotationInput = z.infer<typeof quotationSchema>;

export function computeTotals(items: QuotationItemInput[], taxRate: number, discountAmount = 0) {
  const subtotal = items.reduce((acc, it) => acc + it.quantity * it.unitPrice, 0);
  const taxable = Math.max(0, subtotal - discountAmount);
  const taxAmount = (taxable * taxRate) / 100;
  const total = taxable + taxAmount;
  return { subtotal, taxAmount, total };
}
