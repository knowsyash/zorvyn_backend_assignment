import { UserModel } from "../modules/auth/user.model";
import { RecordModel } from "../modules/records/record.model";
import { env } from "./env";

/**
 * Seed default admin user if no admin exists in the database.
 * The password will be hashed by the User model's pre-save hook.
 */
export const seedAdmin = async (): Promise<void> => {
    try {
        const adminExists = await UserModel.findOne({ role: "admin" });

        if (adminExists) {
            console.log("Admin already exists");
            return;
        }

        await UserModel.create({
            name: "Admin",
            email: "admin@finance.com",
            password: "admin123",
            role: "admin",
            status: "active",
        });

        console.log("Default admin seeded");
    } catch (error) {
        console.error("Error seeding admin:", error);
        throw error;
    }
};

type DemoResetSummary = {
    usersReset: number;
    recordsReset: number;
};

const upsertDemoUser = async (params: {
    name: string;
    email: string;
    password: string;
    role: "viewer" | "analyst" | "admin";
}) => {
    const existing = await UserModel.findOne({ email: params.email.trim().toLowerCase() });

    if (existing) {
        return existing;
    }

    return UserModel.create({
        name: params.name,
        email: params.email.trim().toLowerCase(),
        password: params.password,
        role: params.role,
        status: "active",
    });
};

const demoRecordsPayload = (adminUserId: unknown) => [
    {
        amount: 10000,
        type: "income",
        category: "Salary",
        date: "2024-01-10",
        notes: "Monthly salary",
        createdBy: adminUserId,
        isDeleted: false,
    },
    {
        amount: 4200,
        type: "income",
        category: "Freelance",
        date: "2024-02-05",
        notes: "Client project",
        createdBy: adminUserId,
        isDeleted: false,
    },
    {
        amount: 3000,
        type: "expense",
        category: "Rent",
        date: "2024-01-02",
        notes: "Apartment rent",
        createdBy: adminUserId,
        isDeleted: false,
    },
    {
        amount: 900,
        type: "expense",
        category: "Utilities",
        date: "2024-01-15",
        notes: "Electricity and internet",
        createdBy: adminUserId,
        isDeleted: false,
    },
    {
        amount: 1300,
        type: "expense",
        category: "Food",
        date: "2024-02-11",
        notes: "Groceries and dining",
        createdBy: adminUserId,
        isDeleted: false,
    },
    {
        amount: 600,
        type: "expense",
        category: "Transport",
        date: "2024-02-18",
        notes: "Fuel and rides",
        createdBy: adminUserId,
        isDeleted: false,
    },
];

const createDemoUsersAndRecords = async () => {
    const admin = await upsertDemoUser({
        name: "Demo Admin",
        email: env.demoAdminEmail,
        password: env.demoAdminPassword,
        role: "admin",
    });

    await upsertDemoUser({
        name: "Demo Analyst",
        email: env.demoAnalystEmail,
        password: env.demoAnalystPassword,
        role: "analyst",
    });

    await upsertDemoUser({
        name: "Demo Viewer",
        email: env.demoViewerEmail,
        password: env.demoViewerPassword,
        role: "viewer",
    });

    await RecordModel.insertMany(demoRecordsPayload(admin._id));
};

export const refreshDemoData = async (): Promise<DemoResetSummary> => {
    const demoEmails = [
        env.demoAdminEmail.trim().toLowerCase(),
        env.demoAnalystEmail.trim().toLowerCase(),
        env.demoViewerEmail.trim().toLowerCase(),
    ];

    const deletedRecords = await RecordModel.deleteMany({});
    const deletedUsers = await UserModel.deleteMany({ email: { $in: demoEmails } });

    await createDemoUsersAndRecords();

    return {
        usersReset: deletedUsers.deletedCount ?? 0,
        recordsReset: deletedRecords.deletedCount ?? 0,
    };
};

export const seedDemoData = async (): Promise<void> => {
    if (!env.enableDemoSeed) {
        return;
    }

    try {
        const existingRecordsCount = await RecordModel.countDocuments({});

        if (existingRecordsCount > 0) {
            console.log("Demo records already exist, skipping demo seed");
            return;
        }

        await createDemoUsersAndRecords();

        console.log("Demo users and records seeded");
    } catch (error) {
        console.error("Error seeding demo data:", error);
        throw error;
    }
};

export const resetDemoData = refreshDemoData;
