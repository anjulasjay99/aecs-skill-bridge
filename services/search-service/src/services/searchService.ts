import { MentorProfile } from "../models/MentorProfile.js";
import { User } from "../models/UserModel.js";
import { Types } from "mongoose";

// Get mentors with optional filters and pagination
export const searchMentors = async (filters: any) => {
    const query: any = {};

    // --- Filter logic ---
    if (filters.domains) {
        const domainsArray = filters.domains
            .split(",")
            .map((d: string) => d.trim());
        query.domains = { $in: domainsArray };
    }

    if (filters.exp) {
        query.yearsOfExperience = { $gte: Number(filters.exp) };
    }

    if (filters.badges) {
        const badgesArray = filters.badges
            .split(",")
            .map((b: string) => b.trim());
        query.badges = { $in: badgesArray };
    }

    if (filters.designation) {
        query.designation = { $regex: filters.designation, $options: "i" };
    }

    if (filters.hourlyRate) {
        query.hourlyRate = { $lte: Number(filters.hourlyRate) };
    }

    // --- Pagination setup ---
    const page = parseInt(filters.page) > 0 ? parseInt(filters.page) : 1;
    const size = parseInt(filters.size) > 0 ? parseInt(filters.size) : 10;
    const skip = (page - 1) * size;

    // --- Query execution ---
    const totalMentors = await MentorProfile.countDocuments(query);

    const mentors = await MentorProfile.find(query)
        .populate({
            path: "userId",
            model: User,
            select: "firstName lastName email role active",
            match: { active: true },
        })
        .sort({ yearsOfExperience: -1, hourlyRate: 1 })
        .skip(skip)
        .limit(size);

    // Filter out inactive users
    const activeMentors = mentors.filter((m) => m.userId);

    return {
        page,
        size,
        totalMentors,
        totalPages: Math.ceil(totalMentors / size),
        mentors: activeMentors,
    };
};

// Get mentor by ID
export const getMentorById = async (mentorId: string) => {
    return await MentorProfile.findOne({ userId: new Types.ObjectId(mentorId) })
        .populate({
            path: "userId",
            model: User,
            select: "firstName lastName email role active",
        })
        .exec();
};
