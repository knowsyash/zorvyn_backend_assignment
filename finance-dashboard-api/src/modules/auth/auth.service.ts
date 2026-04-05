import { signAccessToken } from "../../utils/jwt";
import { RegisterInput } from "./auth.schema";
import { UserModel } from "./user.model";

type SafeUser = {
    id: string;
    name: string;
    email: string;
    role: "viewer" | "analyst" | "admin";
    status: "active" | "inactive";
    createdAt: Date;
};

export const register = async (data: RegisterInput): Promise<SafeUser> => {
    const existingUser = await UserModel.findOne({ email: data.email }).select("_id").lean();

    if (existingUser) {
        throw new Error("EMAIL_EXISTS");
    }

    // Password will be hashed by the pre-save hook in User model
    const user = await UserModel.create({
        name: data.name,
        email: data.email,
        password: data.password,
        role: data.role,
        status: "active",
    });

    return {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        createdAt: user.createdAt,
    };
};

export const login = async (email: string, password: string) => {
    const user = await UserModel.findOne({ email });

    if (!user) {
        throw new Error("INVALID_CREDENTIALS");
    }

    if (user.status !== "active") {
        throw new Error("INACTIVE_USER");
    }

    // Use the comparePassword instance method from User model
    const passwordMatches = await user.comparePassword(password);

    if (!passwordMatches) {
        throw new Error("INVALID_CREDENTIALS");
    }

    const token = signAccessToken(
        { id: user._id.toString(), email: user.email, role: user.role },
        "7d"
    );

    return {
        token,
        user: {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            role: user.role,
            status: user.status,
        },
    };
};
