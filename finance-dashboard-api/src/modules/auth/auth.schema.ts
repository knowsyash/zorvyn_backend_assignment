import { z } from "zod";

export const LoginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
});

export const RegisterSchema = LoginSchema.extend({
    name: z.string().min(2),
    role: z.enum(["viewer", "analyst", "admin"]),
});

export type LoginInput = z.infer<typeof LoginSchema>;
export type RegisterInput = z.infer<typeof RegisterSchema>;
