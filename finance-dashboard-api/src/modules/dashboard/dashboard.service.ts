import { RecordModel } from "../records/record.model";

/**
 * Get summary of all financial records.
 * Uses single aggregation with $cond to separate income/expense totals.
 */
export const getSummary = async () => {
    const result = await RecordModel.aggregate([
        { $match: { isDeleted: false } },
        {
            $group: {
                _id: null,
                totalIncome: {
                    $sum: {
                        $cond: [{ $eq: ["$type", "income"] }, "$amount", 0],
                    },
                },
                totalExpenses: {
                    $sum: {
                        $cond: [{ $eq: ["$type", "expense"] }, "$amount", 0],
                    },
                },
                totalRecords: { $sum: 1 },
            },
        },
        {
            $project: {
                _id: 0,
                totalIncome: 1,
                totalExpenses: 1,
                netBalance: { $subtract: ["$totalIncome", "$totalExpenses"] },
                totalRecords: 1,
            },
        },
    ]);

    const summary = result[0] || {
        totalIncome: 0,
        totalExpenses: 0,
        netBalance: 0,
        totalRecords: 0,
    };

    return summary;
};

/**
 * Get financial records grouped by category and type.
 * Useful for pie charts and breakdown visualizations.
 */
export const getCategoryBreakdown = async () => {
    const rows = await RecordModel.aggregate([
        { $match: { isDeleted: false } },
        {
            $group: {
                _id: { category: "$category", type: "$type" },
                total: { $sum: "$amount" },
            },
        },
        {
            $project: {
                _id: 0,
                category: "$_id.category",
                type: "$_id.type",
                total: 1,
            },
        },
        { $sort: { category: 1, type: 1 } },
    ]);

    return rows;
};

/**
 * Get recent financial records with user enrichment via $lookup.
 * Limits results to avoid excessive data transfer.
 */
export const getRecentActivity = async (limit = 10) => {
    const safeLimit = Math.max(1, Math.min(100, limit));

    const records = await RecordModel.aggregate([
        { $match: { isDeleted: false } },
        { $sort: { createdAt: -1 } },
        { $limit: safeLimit },
        {
            $lookup: {
                from: "users",
                localField: "createdBy",
                foreignField: "_id",
                as: "user",
            },
        },
        {
            $project: {
                _id: 1,
                amount: 1,
                type: 1,
                category: 1,
                date: 1,
                notes: 1,
                createdAt: 1,
                updatedAt: 1,
                createdByName: { $arrayElemAt: ["$user.name", 0] },
            },
        },
    ]);

    return records.map((record) => ({
        id: String(record._id),
        amount: record.amount,
        type: record.type,
        category: record.category,
        date: record.date,
        notes: record.notes,
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
        createdByName: record.createdByName || "Unknown",
    }));
};

/**
 * Get monthly income/expense trends for a specified year.
 * Returns all 12 months with zeros for months that have no records,
 * making it easy for frontend libraries (charts) to render without gaps.
 */
export const getMonthlyTrends = async (year: number) => {
    const yearString = String(year);

    const rows = await RecordModel.aggregate([
        {
            $match: {
                isDeleted: false,
                $expr: {
                    $eq: [{ $substr: ["$date", 0, 4] }, yearString],
                },
            },
        },
        {
            $group: {
                _id: { month: { $toInt: { $substr: ["$date", 5, 2] } } },
                income: {
                    $sum: {
                        $cond: [{ $eq: ["$type", "income"] }, "$amount", 0],
                    },
                },
                expenses: {
                    $sum: {
                        $cond: [{ $eq: ["$type", "expense"] }, "$amount", 0],
                    },
                },
            },
        },
        {
            $project: {
                _id: 0,
                month: "$_id.month",
                income: 1,
                expenses: 1,
            },
        },
        { $sort: { month: 1 } },
    ]);

    const byMonth = new Map<number, { income: number; expenses: number }>();
    for (const row of rows) {
        byMonth.set(Number(row.month), {
            income: Number(row.income ?? 0),
            expenses: Number(row.expenses ?? 0),
        });
    }

    // Assumption: returning all months (1-12) with zeros simplifies frontend chart rendering.
    const trend = [] as Array<{ month: number; income: number; expenses: number }>;
    for (let month = 1; month <= 12; month += 1) {
        const monthData = byMonth.get(month) || { income: 0, expenses: 0 };
        trend.push({ month, income: monthData.income, expenses: monthData.expenses });
    }

    return trend;
};
