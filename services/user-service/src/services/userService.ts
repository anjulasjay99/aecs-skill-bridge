import bcrypt from "bcryptjs";
import { MentorProfile } from "../models/MentorProfile.js";
import { User as UserDB } from "../models/UserModel.js";
import APIError from "../types/APIError.js";
import { Role } from "../types/Enums.js";
import { User } from "../types/User.js";
import jwt from "jsonwebtoken";

export const createUser = async (user: User) => {
    const exists = await UserDB.exists({ email: user.email });

    if (exists) {
        console.log(`Error when creating the new user: User already exists`);
        throw new APIError("User already exists", 400);
    }

    const res = await UserDB.create(user);

    if (res.errors) {
        console.log(`Error when creating the new user: ${res.errors.errors}`);
        throw new APIError("Could not create the user, try again later", 500);
    }
    return res;
};

export const authUser = async (email: string, password: string) => {
    const user = await UserDB.findOne({ email });

    if (!user) {
        throw new APIError("User doesn't exist", 400);
    }

    const match = await bcrypt.compare(password, user.password);

    if (match) {
        if (user.role === Role.MENTEE) {
            const token = jwt.sign({ user }, "secret");
            return token;
        } else {
            const mentorProfile = await MentorProfile.findOne({
                userId: user._id,
            });

            const token = jwt.sign({ user, mentorProfile }, "secret");

            return token;
        }
    } else {
        throw new APIError("Invalid credentials", 400);
    }
};

export const getUserById = async (userId: string) => {
    return await UserDB.findOne({ _id: userId });
};
