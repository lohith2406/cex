import type { ZodError } from "zod";

export function zodErrorMessage(error: ZodError): string {
    return error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join(", ");
}