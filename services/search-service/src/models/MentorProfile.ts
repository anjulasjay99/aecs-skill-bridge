// src/models/MentorProfile.ts
export interface IMentorProfile {
    userId: string;
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
