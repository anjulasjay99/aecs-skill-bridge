import { Router } from "express";
import {
    createBooking,
    getBookings,
    getBookingById,
    updateBooking,
    deleteBooking,
} from "../services/bookingService.js";
import { authenticateToken } from "../middleware/authMiddleware.js";
import axios from "axios";

const router = Router();

// Create a new booking
router.post("/", authenticateToken, async (req, res) => {
    const { mentorId, menteeId, slotId, payment, isConfirmed } = req.body;
    const createdDate = new Date().toISOString();

    try {
        const booking = await createBooking({
            mentorId,
            menteeId,
            slotId,
            payment,
            isConfirmed: isConfirmed || false,
            createdDate,
        });

        res.status(201).json({
            message: "Booking created successfully",
            booking,
        });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
});

// GET /bookings?mentorId=...&menteeId=...
router.get("/", authenticateToken, async (req, res) => {
    const { mentorId, menteeId, slotId } = req.query;

    try {
        const bookings = await getBookings({
            mentorId: mentorId as string | undefined,
            menteeId: menteeId as string | undefined,
            slotId: slotId as string | undefined,
        });

        res.status(200).json({ count: bookings.length, bookings });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
});

// GET /bookings/:bookingId
router.get("/:bookingId", authenticateToken, async (req, res) => {
    const { bookingId } = req.params;

    try {
        const booking = await getBookingById(bookingId);
        if (!booking) {
            return res.status(404).json({ message: "Booking not found" });
        }

        res.status(200).json({ booking });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
});

// PATCH /bookings/:bookingId
router.patch("/:bookingId", authenticateToken, async (req, res) => {
    const { bookingId } = req.params;
    const updateData = req.body;

    try {
        const updated = await updateBooking(bookingId, updateData);
        if (!updated) {
            return res.status(404).json({ message: "Booking not found" });
        }

        res.status(200).json({
            message: "Booking updated successfully",
            booking: updated,
        });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
});

// DELETE /bookings/:bookingId
router.delete("/:bookingId", authenticateToken, async (req, res) => {
    const { bookingId } = req.params;
    const token = req.headers.authorization;

    try {
        // Get the booking before deleting (to find its slotId)
        const booking = await getBookingById(bookingId);
        if (!booking) {
            return res.status(404).json({ message: "Booking not found" });
        }

        const slotId = booking.slotId;

        // Delete booking record
        const deleted = await deleteBooking(bookingId);
        if (!deleted) {
            return res.status(404).json({ message: "Booking not found" });
        }

        // Update slot availability in availability-service
        if (slotId) {
            try {
                await axios.patch(
                    `${process.env.AVAILABILITY_SERVICE_URL}/availability/${slotId}`,
                    {
                        isAvailable: true,
                        isBooked: false,
                        bookingId: null,
                    },
                    {
                        headers: {
                            Authorization: token,
                        },
                    }
                );
            } catch (err: any) {
                console.error("⚠️ Failed to update availability:", err.message);
            }
        }

        // Respond to client
        res.status(200).json({
            message: "Booking deleted and slot released successfully",
        });
    } catch (error: any) {
        console.error("❌ Error deleting booking:", error.message);
        res.status(500).json({ message: error.message });
    }
});

export default router;
