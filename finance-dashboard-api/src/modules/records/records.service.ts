import { FilterQuery, Types } from "mongoose";
import { CreateRecordInput, FilterInput, UpdateRecordInput } from "./records.schema";
import { RecordDocument, RecordModel } from "./record.model";

type RecordOutput = {
    id: string;
    amount: number;
    type: "income" | "expense";
    category: string;
    date: string;
    notes?: string;
    createdBy: string;
    isDeleted: boolean;
    createdAt: Date;
    updatedAt: Date;
};

const toRecordOutput = (record: {
    _id: unknown;
    amount: number;
    type: "income" | "expense";
    category: string;
    date: string;
    notes?: string;
    createdBy: Types.ObjectId;
    isDeleted: boolean;
    createdAt: Date;
    updatedAt: Date;
}): RecordOutput => ({
    id: String(record._id),
    amount: record.amount,
    type: record.type,
    category: record.category,
    date: record.date,
    notes: record.notes,
    createdBy: String(record.createdBy),
    isDeleted: record.isDeleted,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
});

export const createRecord = async (data: CreateRecordInput, userId: string): Promise<RecordOutput> => {
    const created = await RecordModel.create({
        amount: data.amount,
        type: data.type,
        category: data.category,
        date: data.date,
        notes: data.notes,
        createdBy: new Types.ObjectId(userId),
        isDeleted: false,
    });

    return toRecordOutput(created.toObject());
};

export const getRecords = async (filters: FilterInput) => {
    const query: FilterQuery<RecordDocument> = { isDeleted: false };

    if (filters.type) {
        query.type = filters.type;
    }

    if (filters.category) {
        query.category = filters.category.trim();
    }

    if (filters.from || filters.to) {
        query.date = {};
        if (filters.from) {
            (query.date as Record<string, string>).$gte = filters.from;
        }
        if (filters.to) {
            (query.date as Record<string, string>).$lte = filters.to;
        }
    }

    const skip = (filters.page - 1) * filters.limit;

    const [records, total] = await Promise.all([
        RecordModel.find(query).sort({ date: -1, createdAt: -1 }).skip(skip).limit(filters.limit).lean(),
        RecordModel.countDocuments(query),
    ]);

    return {
        data: records.map((record) => toRecordOutput(record)),
        total,
        page: filters.page,
        limit: filters.limit,
    };
};

export const getRecordById = async (id: string): Promise<RecordOutput> => {
    const record = await RecordModel.findOne({ _id: id, isDeleted: false }).lean();

    if (!record) {
        throw new Error("RECORD_NOT_FOUND");
    }

    return toRecordOutput(record);
};

export const updateRecord = async (id: string, data: UpdateRecordInput): Promise<RecordOutput> => {
    if (Object.keys(data).length === 0) {
        throw new Error("NO_UPDATABLE_FIELDS");
    }

    const record = await RecordModel.findOneAndUpdate(
        { _id: id, isDeleted: false },
        { $set: data },
        { new: true, runValidators: true }
    ).lean();

    if (!record) {
        throw new Error("RECORD_NOT_FOUND");
    }

    return toRecordOutput(record);
};

export const deleteRecord = async (id: string): Promise<void> => {
    const deleted = await RecordModel.findOneAndUpdate(
        { _id: id, isDeleted: false },
        { $set: { isDeleted: true } },
        { new: false }
    ).lean();

    if (!deleted) {
        throw new Error("RECORD_NOT_FOUND");
    }
};
