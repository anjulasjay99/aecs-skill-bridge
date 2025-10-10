import { MentorProfile as MentorProfileDB } from "../models/MentorProfile";
import APIError from "../types/APIError";
import { MentorProfile } from "../types/User";

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
