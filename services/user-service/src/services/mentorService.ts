import { MentorProfile as MentorProfileDB } from "../models/MentorProfile.js";
import APIError from "../types/APIError.js";
import { MentorProfile } from "../types/User.js";

export const createMentorProfile = async (mentorProfile: MentorProfile) => {
    const res = await MentorProfileDB.create(mentorProfile);

    if (res.errors) {
        console.log(
            `Error when creating the mentor profile: ${res.errors.errors}`
        );
        throw new APIError(
            "Could not create the mentor profile, try again later",
            500
        );
    }
    return res;
};
