import { model, Schema, Types } from "mongoose";

export interface RecordDocument {
    amount: number;
    type: "income" | "expense";
    category: string;
    date: string;
    notes?: string;
    createdBy: Types.ObjectId;
    isDeleted: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const recordSchema = new Schema<RecordDocument>(
    {
        amount: { type: Number, required: true, min: 0 },
        type: { type: String, enum: ["income", "expense"], required: true },
        category: { type: String, required: true, trim: true },
        date: { type: String, required: true },
        notes: { type: String, trim: true },
        createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
        isDeleted: { type: Boolean, default: false },
    },
    { timestamps: true }
);

// Pre-save hook: update updatedAt on every save
recordSchema.pre("save", function (next) {
    this.updatedAt = new Date();
    next();
});

export const RecordModel = model<RecordDocument>("FinancialRecord", recordSchema);
