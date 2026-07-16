import * as z from "zod";

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .email("Ingresá un email válido")
    .transform((value) => value.toLowerCase()),

  password: z
    .string()
    .min(6, "La contraseña debe tener al menos 6 caracteres")
    .max(72, "La contraseña es demasiado larga"),
});

export const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(50, "El nombre no puede superar los 50 caracteres"),

  lastName: z
    .string()
    .trim()
    .min(2, "El apellido debe tener al menos 2 caracteres")
    .max(50, "El apellido no puede superar los 50 caracteres"),

  email: z
    .string()
    .trim()
    .email("Ingresá un email válido")
    .transform((value) => value.toLowerCase()),

  password: z
    .string()
    .min(6, "La contraseña debe tener al menos 6 caracteres")
    .max(72, "La contraseña no puede superar los 72 caracteres"),

  role: z
    .enum(["admin", "trainer", "student"])
    .optional()
    .default("student"),
});