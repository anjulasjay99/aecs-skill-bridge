import { Router } from "express";
import bcrypt from "bcryptjs";
import { Role } from "../types/Enums.js";
import { createUser, authUser, getUserById } from "../services/userService.js";
import { createMentorProfile } from "../services/mentorService.js";
import { v4 as uuidv4 } from "uuid";

const router = Router();

router.get("/:id", async (req, res) => {
    try {
        const user = await getUserById(req.params.id);
        if (!user) return res.status(404).json({ message: "User not found" });
        res.json({ user });
    } catch (err: any) {
        res.status(500).json({ message: err.message });
    }
});

router.post("/login", async (req, res) => {
    const { email, password } = req.body;
    try {
        const token = await authUser(email, password);
        res.status(200).json({ message: "Success", token });
    } catch (err: any) {
        res.status(err.statusCode || 500).json({ message: err.message });
    }
});

router.post("/", async (req, res) => {
    const { email, password, firstName, lastName, role, mentorProfile } =
        req.body;

    const createdAt = new Date().toISOString();
    const hashedPassword = await bcrypt.hash(password, 10);

    try {
        const _id = uuidv4();
        const user = await createUser({
            _id,
            email,
            password: hashedPassword,
            firstName,
            lastName,
            role,
            active: true,
            createdAt,
            updatedAt: createdAt,
            userId: email,
        });

        if (role === Role.MENTOR && mentorProfile) {
            const mentorData = await createMentorProfile({
                _id,
                userId: email,
                ...mentorProfile,
                createdAt,
                updatedAt: createdAt,
            });
            return res.json({
                message: "User + Mentor profile created",
                user,
                mentorData,
            });
        }

        res.json({ message: "User created", user });
    } catch (err: any) {
        res.status(err.statusCode || 500).json({ message: err.message });
    }
});

export default router;
