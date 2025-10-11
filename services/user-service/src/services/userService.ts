import { User as UserDB } from "../models/UserModel.js";
import APIError from "../types/APIError.js";
import { User } from "../types/User.js";

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
