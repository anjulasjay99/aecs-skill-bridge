// src/models/UserModel.ts
import { Role } from "../types/Enums.js";

export interface IUser {
    _id: string;
    userId: string;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: Role;
    active: boolean;
    createdAt: string;
    updatedAt: string;
}
