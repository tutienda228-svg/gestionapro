import { z } from "zod";

export const invoiceItemSchema = z.object({
  description: z.string().trim().min(1, "Describe el ítem"),
  quantity: z.coerce.number().min(0.01, "Cantidad inválida"),
  unit: z.string().trim().optional().or(z.literal("")),
  unitPrice: z.coerce.number().min(0, "Precio inválido"),
});
export type InvoiceItemInput = z.infer<typeof invoiceItemSchema>;

export const invoiceSchema = z.object({
  clientId: z.string().uuid("Selecciona un cliente"),
  projectId: z.string().optional().nullable(),
  issueDate: z.string().min(1, "Fecha de emisión requerida"),
  dueDate: z.string().optional().or(z.literal("")),
  taxRate: z.coerce.number().min(0).max(100).default(0),
  paymentTerms: z.string().trim().optional().or(z.literal("")),
  notes: z.string().trim().optional().or(z.literal("")),
  items: z.array(invoiceItemSchema).min(1, "Agrega al menos un ítem"),
});
export type InvoiceInput = z.infer<typeof invoiceSchema>;

export function computeInvoiceTotals(items: InvoiceItemInput[], taxRate: number) {
  const subtotal = items.reduce((acc, it) => acc + it.quantity * it.unitPrice, 0);
  const taxAmount = (subtotal * taxRate) / 100;
  const total = subtotal + taxAmount;
  return { subtotal, taxAmount, total };
}

export const paymentSchema = z.object({
  amount: z.coerce.number().min(1, "Monto inválido"),
  paymentDate: z.string().min(1, "Fecha requerida"),
  paymentMethod: z.string().trim().optional().or(z.literal("")),
  reference: z.string().trim().optional().or(z.literal("")),
  notes: z.string().trim().optional().or(z.literal("")),
});
