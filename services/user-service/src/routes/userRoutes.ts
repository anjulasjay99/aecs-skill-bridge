import { Router } from "express";
import { authUser, createUser, getUserById } from "../services/userService.js";
import bcrypt from "bcryptjs";
import { Role } from "../types/Enums.js";
import { createMentorProfile } from "../services/mentorService.js";
import { Types } from "mongoose";

const router = Router();

router.get("/:userId", async (_req, res) => {
    const { userId } = _req.params;

    try {
        const user = await getUserById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json({ user });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
});

router.post("/login", async (_req, res) => {
    const { email, password } = _req.body;

    try {
        const token = await authUser(email, password);
        res.status(200).json({
            message: "Success",
            token,
        });
    } catch (error: any) {
        res.status(error.statusCode ?? 500).json({
            message: error.message,
        });
    }
});

router.post("/", async (_req, res) => {
    const { email, password, firstName, lastName, role } = _req.body;

    const createdAt = new Date().toISOString();
    const hashedPassword = await bcrypt.hash(password, 10);

    try {
        const user = await createUser({
            email,
            password: hashedPassword,
            firstName,
            lastName,
            role,
            createdAt,
            updatedAt: createdAt,
            active: true,
        });

        if (role === Role.MENTEE) {
            res.status(200).json({
                message: "Successfully created the user",
                user,
            });
        } else {
            const {
                designation,
                bio,
                domains,
                yearsOfExperience,
                hourlyRate,
                badges,
                socials,
            } = _req.body.mentorProfile;

            const mentorProfile = await createMentorProfile({
                userId: user._id as Types.ObjectId,
                designation,
                bio,
                domains,
                yearsOfExperience,
                hourlyRate,
                badges,
                socials,
                createdAt,
                updatedAt: createdAt,
            });

            res.status(200).json({
                message: "Successfully created the user",
                user,
                mentorProfile,
            });
        }
    } catch (error: any) {
        res.status(error.statusCode).json({
            message: error.message,
        });
    }
});

export default router;
