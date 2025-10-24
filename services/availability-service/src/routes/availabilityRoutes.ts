// @ts-nocheck
import { Router } from "express";
import {
    createAvailabilitySlot,
    getAvailabilitySlots,
    getSlotById,
    updateAvailabilitySlot,
    deleteAvailabilitySlot,
} from "../services/availabilityService.js";
import {
    authenticateToken,
    AuthRequest,
} from "../middleware/authMiddleware.js";
import { Role } from "../types/Enums.js";

const router = Router();

// Health check
router.get("/", authenticateToken, (_req, res) => {
    res.json({ message: "Availability endpoint working" });
});

// Get all slots for a mentor
router.get("/:mentorId", authenticateToken, async (req, res) => {
    const { mentorId } = req.params;
    const { date, isAvailable, isBooked } = req.query;

    try {
        const slots = await getAvailabilitySlots(mentorId, {
            date,
            isAvailable: isAvailable ? isAvailable === "true" : undefined,
            isBooked: isBooked ? isBooked === "true" : undefined,
        });

        res.status(200).json({ mentorId, slots });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get slot by ID
router.get("/slots/:slotId", authenticateToken, async (req, res) => {
    const { slotId } = req.params;
    try {
        const slot = await getSlotById(slotId);
        if (!slot) return res.status(404).json({ message: "Slot not found" });
        res.status(200).json({ slot });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Create slot
router.post("/", authenticateToken, async (req: AuthRequest, res) => {
    if (req.user?.role === Role.MENTEE)
        return res
            .status(401)
            .json({ message: "User cannot perform this action" });

    try {
        const slot = await createAvailabilitySlot(req.body);
        res.status(201).json({
            message: "Availability slot created successfully",
            slot,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Update slot
router.patch("/:slotId", authenticateToken, async (req, res) => {
    const { slotId } = req.params;

    try {
        const updatedSlot = await updateAvailabilitySlot(slotId, req.body);
        if (!updatedSlot)
            return res.status(404).json({ message: "Slot not found" });

        res.status(200).json({
            message: "Availability slot updated successfully",
            slot: updatedSlot,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Delete slot
router.delete("/:slotId", authenticateToken, async (req: AuthRequest, res) => {
    if (req.user?.role === Role.MENTEE)
        return res
            .status(401)
            .json({ message: "User cannot perform this action" });

    try {
        const deleted = await deleteAvailabilitySlot(req.params.slotId);
        if (!deleted)
            return res.status(404).json({ message: "Slot not found" });

        res.status(200).json({
            message: "Availability slot deleted successfully",
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;
