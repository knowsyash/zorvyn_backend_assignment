import { z } from "zod";

const DateRegex = /^\d{4}-\d{2}-\d{2}$/;

export const CreateRecordSchema = z.object({
    amount: z.number().positive(),
    type: z.enum(["income", "expense"]),
    category: z.string().min(1),
    date: z.string().regex(DateRegex, "date must be YYYY-MM-DD"),
    notes: z.string().optional(),
});

export const UpdateRecordSchema = CreateRecordSchema.partial();

export const FilterSchema = z.object({
    type: z.enum(["income", "expense"]).optional(),
    category: z.string().min(1).optional(),
    from: z.string().regex(DateRegex, "from must be YYYY-MM-DD").optional(),
    to: z.string().regex(DateRegex, "to must be YYYY-MM-DD").optional(),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
});

export type CreateRecordInput = z.infer<typeof CreateRecordSchema>;
export type UpdateRecordInput = z.infer<typeof UpdateRecordSchema>;
export type FilterInput = z.infer<typeof FilterSchema>;
