import { Types } from "mongoose";
import { Role } from "./Enums.js";

export type User = {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: Role;
    active: boolean;
    createdAt: string;
    updatedAt: string;
};
