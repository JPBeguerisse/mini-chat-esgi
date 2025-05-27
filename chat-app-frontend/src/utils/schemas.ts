import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Adresse e-mail requise"),
  password: z.string().min(1, "Mot de passe requis"),
});

export const registerSchema = z
  .object({
    email: z.string().email("Email invalide"),
    username: z
      .string()
      .min(3, "Le nom d'utilisateur doit contenir au moins 3 caractères"),
    password: z
      .string()
      .min(6, "Le mot de passe doit contenir au moins 6 caractères"),
    confirmPassword: z
      .string()
      .min(6, "La confirmation du mot de passe est requise"),
    color: z.string().min(1, "Couleur requise"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Les mot de passe ne correspondent pas",
    path: ["confirmPassword"],
  });
