import { Schema, model, Document, Types } from "mongoose";

export interface IMentorProfile extends Document {
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
}

const MentorProfileSchema = new Schema<IMentorProfile>({
    userId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
        unique: true,
        index: true,
    },
    designation: { type: String, trim: true, maxlength: 160 },
    bio: { type: String, trim: true, maxlength: 4000 },
    domains: [{ type: String, trim: true }],
    yearsOfExperience: { type: Number, min: 0, max: 60 },
    hourlyRate: { type: Number, min: 0 },
    badges: [{ type: String, trim: true }],
    socials: {
        linkedin: { type: String, trim: true },
        github: { type: String, trim: true },
        website: { type: String, trim: true },
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

export const MentorProfile = model<IMentorProfile>(
    "MentorProfile",
    MentorProfileSchema
);
