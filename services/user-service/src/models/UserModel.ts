import { Schema, model, Document } from "mongoose";
import { Role } from "../types/Enums.js";

export interface IUser extends Document {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: Role;
    active: boolean;
    createdAt: string;
    updatedAt: string;
}

const UserSchema = new Schema<IUser>({
    email: {
        type: String,
        required: true,
        index: true,
    },
    password: {
        type: String,
        trim: true,
    },
    firstName: {
        type: String,
        trim: true,
    },
    lastName: {
        type: String,
        trim: true,
    },
    role: {
        type: String,
        enum: Object.values(Role),
        required: true,
        default: Role.MENTEE,
    },
    active: {
        type: Boolean,
        default: true,
    },
    createdAt: {
        type: String,
        trim: true,
    },
    updatedAt: {
        type: String,
        trim: true,
    },
});

export const User = model<IUser>("User", UserSchema);
