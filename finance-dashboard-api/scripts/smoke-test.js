/* eslint-disable no-console */
const http = require("http");

const baseUrl = process.argv[2] || process.env.BASE_URL || "http://localhost:4000";

const requestJson = (path, options = {}) => {
    const method = options.method || "GET";
    const token = options.token;
    const body = options.body;

    return new Promise((resolve, reject) => {
        const target = new URL(path, baseUrl);
        const payload = body ? JSON.stringify(body) : null;

        const headers = {
            Accept: "application/json",
        };

        if (payload) {
            headers["Content-Type"] = "application/json";
            headers["Content-Length"] = Buffer.byteLength(payload);
        }

        if (token) {
            headers.Authorization = `Bearer ${token}`;
        }

        const req = http.request(
            {
                hostname: target.hostname,
                port: target.port,
                path: `${target.pathname}${target.search}`,
                method,
                headers,
            },
            (res) => {
                let raw = "";

                res.on("data", (chunk) => {
                    raw += chunk;
                });

                res.on("end", () => {
                    let parsed = null;

                    try {
                        parsed = raw ? JSON.parse(raw) : null;
                    } catch {
                        parsed = null;
                    }

                    resolve({
                        status: res.statusCode || 0,
                        body: parsed,
                        text: raw,
                    });
                });
            }
        );

        req.setTimeout(10000, () => {
            req.destroy(new Error("timeout"));
        });

        req.on("error", (error) => {
            reject(error);
        });

        if (payload) {
            req.write(payload);
        }

        req.end();
    });
};

const assertOk = (condition, message) => {
    if (!condition) {
        throw new Error(message);
    }
};

const run = async () => {
    const steps = [];
    const uniqueEmail = `smoke_${Date.now()}@example.com`;

    const health = await requestJson("/api/health");
    steps.push(["GET /api/health", health.status]);
    assertOk(health.status === 200, "Health endpoint failed");

    const register = await requestJson("/api/auth/register", {
        method: "POST",
        body: {
            name: "Smoke User",
            email: uniqueEmail,
            password: "password123",
            role: "viewer",
        },
    });
    steps.push(["POST /api/auth/register", register.status]);
    assertOk(register.status === 201, "Register endpoint failed");

    const loginViewer = await requestJson("/api/auth/login", {
        method: "POST",
        body: {
            email: uniqueEmail,
            password: "password123",
        },
    });
    steps.push(["POST /api/auth/login (viewer)", loginViewer.status]);
    assertOk(loginViewer.status === 200 && loginViewer.body && loginViewer.body.data && loginViewer.body.data.token, "Viewer login failed");

    const viewerToken = loginViewer.body.data.token;

    const loginAdmin = await requestJson("/api/auth/login", {
        method: "POST",
        body: {
            email: "admin@finance.com",
            password: "admin123",
        },
    });
    steps.push(["POST /api/auth/login (admin)", loginAdmin.status]);
    assertOk(loginAdmin.status === 200 && loginAdmin.body && loginAdmin.body.data && loginAdmin.body.data.token, "Admin login failed");

    const adminToken = loginAdmin.body.data.token;

    const usersAdmin = await requestJson("/api/users", {
        token: adminToken,
    });
    steps.push(["GET /api/users (admin)", usersAdmin.status]);
    assertOk(usersAdmin.status === 200, "Admin users list failed");

    const usersViewer = await requestJson("/api/users", {
        token: viewerToken,
    });
    steps.push(["GET /api/users (viewer)", usersViewer.status]);
    assertOk(usersViewer.status === 403, "Viewer users list should be forbidden");

    const seed = await requestJson("/api/users/demo/seed", {
        method: "POST",
        token: adminToken,
    });
    steps.push(["POST /api/users/demo/seed", seed.status]);
    assertOk(seed.status === 200, "Demo seed failed");

    const reset = await requestJson("/api/users/demo/reset", {
        method: "POST",
        token: adminToken,
    });
    steps.push(["POST /api/users/demo/reset", reset.status]);
    assertOk(reset.status === 200, "Demo reset failed");

    const createRecord = await requestJson("/api/records", {
        method: "POST",
        token: adminToken,
        body: {
            amount: 1234,
            type: "income",
            category: "Smoke",
            date: "2026-04-06",
            notes: "smoke record",
        },
    });
    steps.push(["POST /api/records", createRecord.status]);
    assertOk(createRecord.status === 201, "Record creation failed");

    const records = await requestJson("/api/records", {
        token: adminToken,
    });
    steps.push(["GET /api/records", records.status]);
    assertOk(records.status === 200, "Record listing failed");

    const summary = await requestJson("/api/dashboard/summary", {
        token: adminToken,
    });
    steps.push(["GET /api/dashboard/summary", summary.status]);
    assertOk(summary.status === 200, "Dashboard summary failed");

    console.log("SMOKE_TEST_RESULTS_START");
    console.log(`BASE_URL=${baseUrl}`);

    for (const [name, status] of steps) {
        console.log(`${name} -> ${status}`);
    }

    const userCount = Array.isArray(usersAdmin.body && usersAdmin.body.users)
        ? usersAdmin.body.users.length
        : "n/a";

    const recordTotal = records.body && typeof records.body.total === "number"
        ? records.body.total
        : "n/a";

    const netBalance = summary.body && typeof summary.body.netBalance === "number"
        ? summary.body.netBalance
        : "n/a";

    console.log(`USERS_COUNT=${userCount}`);
    console.log(`RECORDS_TOTAL=${recordTotal}`);
    console.log(`NET_BALANCE=${netBalance}`);
    console.log("SMOKE_TEST_RESULTS_END");
};

run().catch((error) => {
    console.error("SMOKE_TEST_FAILED=" + error.message);
    process.exit(1);
});
