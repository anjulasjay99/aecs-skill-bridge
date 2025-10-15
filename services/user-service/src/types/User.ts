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

export type MentorProfile = {
    userId: Types.ObjectId;
    designation?: string;
    bio?: string;
    domains?: string[];
    yearsOfExperience?: number;
    hourlyRate?: number;
    badges?: string[];
    socials?: { linkedin?: string; github?: string; website?: string };
    createdAt: string;
    updatedAt: string;
};
