import { z } from "zod";

export const PROJECT_STATUSES = ["pending", "in_progress", "paused", "completed", "cancelled"] as const;

export const projectSchema = z.object({
  clientId: z.string().uuid("Selecciona un cliente"),
  name: z.string().trim().min(2, "El nombre es obligatorio"),
  description: z.string().trim().optional().or(z.literal("")),
  status: z.enum(PROJECT_STATUSES).default("pending"),
  startDate: z.string().optional().or(z.literal("")),
  dueDate: z.string().optional().or(z.literal("")),
  budget: z.coerce.number().min(0).optional().nullable(),
  responsibleUserId: z.string().uuid().optional().nullable(),
});
export type ProjectInput = z.infer<typeof projectSchema>;

export const taskSchema = z.object({
  title: z.string().trim().min(1, "El título es obligatorio"),
  description: z.string().trim().optional().or(z.literal("")),
  assignedToUserId: z.string().uuid().optional().nullable(),
  dueDate: z.string().optional().or(z.literal("")),
});

export const timeEntrySchema = z.object({
  date: z.string().min(1, "Fecha requerida"),
  hours: z.coerce.number().min(0.25, "Mínimo 0.25 horas"),
  activityDescription: z.string().trim().optional().or(z.literal("")),
  hourlyRate: z.coerce.number().min(0).optional().nullable(),
});

export const materialSchema = z.object({
  name: z.string().trim().min(1, "El nombre es obligatorio"),
  quantity: z.coerce.number().min(0.01, "Cantidad inválida"),
  unit: z.string().trim().optional().or(z.literal("")),
  unitCost: z.coerce.number().min(0, "Costo inválido"),
  supplier: z.string().trim().optional().or(z.literal("")),
  notes: z.string().trim().optional().or(z.literal("")),
});
