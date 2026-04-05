import { model, Schema } from "mongoose";
import bcrypt from "bcryptjs";

export type UserRole = "viewer" | "analyst" | "admin";
export type UserStatus = "active" | "inactive";

export interface UserDocument {
    name: string;
    email: string;
    password: string;
    role: UserRole;
    status: UserStatus;
    createdAt: Date;
    updatedAt: Date;
    comparePassword(candidate: string): Promise<boolean>;
}

const userSchema = new Schema<UserDocument>(
    {
        name: { type: String, required: true, trim: true },
        email: { type: String, required: true, unique: true, lowercase: true, trim: true },
        password: { type: String, required: true, minlength: 6 },
        role: { type: String, enum: ["viewer", "analyst", "admin"], default: "viewer" },
        status: { type: String, enum: ["active", "inactive"], default: "active" },
    },
    { timestamps: true }
);

// Pre-save hook: hash password if modified
userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) {
        return next();
    }

    try {
        const saltRounds = 10;
        this.password = await bcrypt.hash(this.password, saltRounds);
        next();
    } catch (error) {
        next(error as Error);
    }
});

// Instance method: compare password
userSchema.methods.comparePassword = async function (
    candidate: string
): Promise<boolean> {
    return bcrypt.compare(candidate, this.password);
};

export const UserModel = model<UserDocument>("User", userSchema);
