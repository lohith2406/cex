import z from "zod";

export const authSchema = z.object({
    email: z.email(),
    password: z.string().min(6, "Password should be at least 6 characters")
})