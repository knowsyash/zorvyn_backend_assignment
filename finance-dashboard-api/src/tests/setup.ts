import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";

jest.setTimeout(30000);

dotenv.config({ path: path.resolve(process.cwd(), ".env.test") });

process.env.ENABLE_DEMO_SEED = process.env.ENABLE_DEMO_SEED || "true";
process.env.ENABLE_DEMO_RESET_ENDPOINT = process.env.ENABLE_DEMO_RESET_ENDPOINT || "true";

beforeAll(async () => {
    if (!process.env.MONGO_URI) {
        throw new Error("MONGO_URI is required in .env.test for tests");
    }

    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to test database:", process.env.MONGO_URI);
});

beforeEach(async () => {
    const collections = Object.values(mongoose.connection.collections);
    await Promise.all(collections.map((collection) => collection.deleteMany({})));
});

afterAll(async () => {
    const collections = Object.values(mongoose.connection.collections);
    await Promise.all(collections.map((collection) => collection.deleteMany({})));
    await mongoose.connection.close();
    console.log("Disconnected from test database");
});
