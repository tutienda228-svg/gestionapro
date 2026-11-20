import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().trim().email("Correo inválido"),
  password: z.string().min(1, "Ingresa tu contraseña"),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const signUpSchema = z.object({
  fullName: z.string().trim().min(2, "Ingresa tu nombre completo"),
  email: z.string().trim().email("Correo inválido"),
  password: z.string().min(8, "Mínimo 8 caracteres"),
});
export type SignUpInput = z.infer<typeof signUpSchema>;

export const requestResetSchema = z.object({
  email: z.string().trim().email("Correo inválido"),
});

export const resetPasswordSchema = z
  .object({
    password: z.string().min(8, "Mínimo 8 caracteres"),
    confirmPassword: z.string().min(8),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

export const createOrgSchema = z.object({
  name: z.string().trim().min(2, "Ingresa el nombre de tu empresa"),
});
export type CreateOrgInput = z.infer<typeof createOrgSchema>;

export const inviteMemberSchema = z.object({
  email: z.string().trim().email("Correo inválido"),
  role: z.enum(["admin", "comercial", "operativo", "readonly"], {
    required_error: "Selecciona un rol",
  }),
});
export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;
