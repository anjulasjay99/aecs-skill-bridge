import { Router } from "express";
import { searchMentors, getMentorById } from "../services/searchService";

const router = Router();

// Filter + Pagination
router.get("/", async (req, res) => {
    try {
        const result = await searchMentors(req.query);

        res.status(200).json({
            page: result.page,
            size: result.size,
            totalMentors: result.totalMentors,
            totalPages: result.totalPages,
            count: result.mentors.length,
            mentors: result.mentors,
        });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
});

//  /mentors/:mentorId — Mentor details
router.get("/:mentorId", async (req, res) => {
    const { mentorId } = req.params;

    try {
        const mentor = await getMentorById(mentorId);
        if (!mentor) {
            return res.status(404).json({ message: "Mentor not found" });
        }

        res.status(200).json({ mentor });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
});

export default router;
