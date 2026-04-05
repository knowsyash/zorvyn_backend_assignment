import app from "./app";
import { connectDatabase } from "./config/database";
import { env } from "./config/env";

const startServer = async () => {
    try {
        await connectDatabase();

        app.listen(env.port, env.host, () => {
            console.log(`Finance Dashboard API running on ${env.host}:${env.port}`);
        });
    } catch (error) {
        console.error("Failed to start server", error);
        process.exit(1);
    }
};

startServer();
