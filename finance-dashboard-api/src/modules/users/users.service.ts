import { UserModel, UserRole, UserStatus } from "../auth/user.model";

export type SafeUser = {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    status: UserStatus;
    createdAt: Date;
};

export type UpdateUserData = {
    name?: string;
    role?: UserRole;
    status?: UserStatus;
};

const toSafeUser = (user: {
    _id: unknown;
    name: string;
    email: string;
    role: UserRole;
    status: UserStatus;
    createdAt: Date;
}): SafeUser => ({
    id: String(user._id),
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    createdAt: user.createdAt,
});

export const getAllUsers = async (): Promise<SafeUser[]> => {
    const users = await UserModel.find({}).select("name email role status createdAt").lean();
    return users.map((user) => toSafeUser(user));
};

export const getUserById = async (id: string): Promise<SafeUser> => {
    const user = await UserModel.findById(id).select("name email role status createdAt").lean();

    if (!user) {
        throw new Error("USER_NOT_FOUND");
    }

    return toSafeUser(user);
};

export const updateUser = async (id: string, data: UpdateUserData): Promise<SafeUser> => {
    if (!data.name && !data.role && !data.status) {
        throw new Error("NO_UPDATABLE_FIELDS");
    }

    const user = await UserModel.findByIdAndUpdate(
        id,
        { $set: data },
        { new: true, runValidators: true }
    )
        .select("name email role status createdAt")
        .lean();

    if (!user) {
        throw new Error("USER_NOT_FOUND");
    }

    return toSafeUser(user);
};

export const deactivateUser = async (id: string): Promise<SafeUser> => {
    const user = await UserModel.findByIdAndUpdate(
        id,
        { $set: { status: "inactive" } },
        { new: true, runValidators: true }
    )
        .select("name email role status createdAt")
        .lean();

    if (!user) {
        throw new Error("USER_NOT_FOUND");
    }

    return toSafeUser(user);
};
