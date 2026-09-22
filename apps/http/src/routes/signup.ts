import { authSchema, zodErrorMessage } from "@repo/validation";
import type { Request, Response } from "express";


export function signup(req: Request, res: Response) {
    const parsed = authSchema.safeParse(req.body);

    if (!parsed.success) {
        res.status(411).json({ message: "Invalid inputs", error: zodErrorMessage(parsed.error)});
        return;
    }

    const { email, password } = parsed.data;
}