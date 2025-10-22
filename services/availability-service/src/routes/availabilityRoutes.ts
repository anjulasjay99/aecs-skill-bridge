import { Response, Router } from "express";
import {
    createAvailabilitySlot,
    getAvailabilitySlots,
    updateAvailabilitySlot,
    deleteAvailabilitySlot,
    getSlotById,
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

// All slots for a mentor (with optional filters)
router.get("/:mentorId", authenticateToken, async (req, res) => {
    const { mentorId } = req.params;
    const { date, isAvailable, isBooked } = req.query;

    try {
        const slots = await getAvailabilitySlots(mentorId, {
            date: date as string | undefined,
            isAvailable: isAvailable ? isAvailable === "true" : undefined,
            isBooked: isBooked ? isBooked === "true" : undefined,
        });

        res.status(200).json({ mentorId, slots });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
});

router.get("/slots/:slotId", authenticateToken, async (req, res) => {
    const { slotId } = req.params;

    try {
        const slot = await getSlotById(slotId);

        res.status(200).json({ slot });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
});

// Create a new availability slot
router.post("/", authenticateToken, async (req: AuthRequest, res: Response) => {
    if (req.user?.role === Role.MENTEE) {
        res.status(401).json({ message: "User cannot perform this action" });
        return;
    }

    const { mentorId, date, startTime, endTime } = req.body;
    const createdAt = new Date().toISOString();

    try {
        const newSlot = await createAvailabilitySlot({
            mentorId,
            date,
            startTime,
            endTime,
            isAvailable: true,
            isBooked: false,
            bookingId: null,
            createdAt,
            updatedAt: createdAt,
        });

        res.status(201).json({
            message: "Availability slot created successfully",
            slot: newSlot,
        });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
});

// Update slot (e.g., toggle availability or mark booked)
router.patch(
    "/:slotId",
    authenticateToken,
    async (req: AuthRequest, res: Response) => {
       
        const { slotId } = req.params;
        const updateData = req.body;
        updateData.updatedAt = new Date().toISOString();

        try {
            const updatedSlot = await updateAvailabilitySlot(
                slotId,
                updateData
            );
            if (!updatedSlot) {
                return res.status(404).json({ message: "Slot not found" });
            }

            res.status(200).json({
                message: "Availability slot updated successfully",
                slot: updatedSlot,
            });
        } catch (error: any) {
            res.status(500).json({ message: error.message });
        }
    }
);

// Remove a slot
router.delete(
    "/:slotId",
    authenticateToken,
    async (req: AuthRequest, res: Response) => {
        if (req.user?.role === Role.MENTEE) {
            res.status(401).json({
                message: "User cannot perform this action",
            });
            return;
        }
        const { slotId } = req.params;

        try {
            const deleted = await deleteAvailabilitySlot(slotId);
            if (!deleted) {
                return res.status(404).json({ message: "Slot not found" });
            }

            res.status(200).json({
                message: "Availability slot deleted successfully",
            });
        } catch (error: any) {
            res.status(500).json({ message: error.message });
        }
    }
);

export default router;
