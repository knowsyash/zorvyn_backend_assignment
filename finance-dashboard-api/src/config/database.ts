import mongoose from "mongoose";
import { env } from "./env";
import { seedAdmin, seedDemoData } from "./seed";

export const connectDatabase = async (): Promise<void> => {
    // Fail fast instead of buffering requests when DB is unavailable.
    mongoose.set("bufferCommands", false);
    mongoose.set("bufferTimeoutMS", 2000);

    await mongoose.connect(env.mongoUri, {
        serverSelectionTimeoutMS: 5000,
        dbName: env.mongoDbName,
    });

    // Seed default admin if database is empty
    await seedAdmin();
    await seedDemoData();

    console.log(`MongoDB connected to database: ${env.mongoDbName}`);
};
