// @ts-nocheck
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

// Create booking
router.post("/", authenticateToken, async (req, res) => {
    const { mentorId, menteeId, slotId, payment, isConfirmed } = req.body;

    try {
        const booking = await createBooking({
            mentorId,
            menteeId,
            slotId,
            payment,
            isConfirmed,
        });

        res.status(201).json({
            message: "Booking created successfully",
            booking,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get all bookings
router.get("/", authenticateToken, async (req, res) => {
    const { mentorId, menteeId, slotId } = req.query;

    try {
        const bookings = await getBookings({
            mentorId: mentorId || undefined,
            menteeId: menteeId || undefined,
            slotId: slotId || undefined,
        });

        res.status(200).json({
            count: bookings.length,
            bookings,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get booking by ID
router.get("/:bookingId", authenticateToken, async (req, res) => {
    const { bookingId } = req.params;

    try {
        const booking = await getBookingById(bookingId);
        if (!booking)
            return res.status(404).json({ message: "Booking not found" });

        res.status(200).json({ booking });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Update booking
router.patch("/:bookingId", authenticateToken, async (req, res) => {
    const { bookingId } = req.params;
    const updateData = req.body;

    try {
        const updated = await updateBooking(bookingId, updateData);
        if (!updated)
            return res.status(404).json({ message: "Booking not found" });

        res.status(200).json({
            message: "Booking updated successfully",
            booking: updated,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Delete booking
router.delete("/:bookingId", authenticateToken, async (req, res) => {
    const { bookingId } = req.params;
    const token = req.headers.authorization;

    try {
        const booking = await getBookingById(bookingId);
        if (!booking)
            return res.status(404).json({ message: "Booking not found" });

        await deleteBooking(bookingId);

        // Update slot availability
        if (booking.slotId) {
            try {
                await axios.patch(
                    `${process.env.AVAILABILITY_SERVICE_URL}/availability/${booking.slotId}`,
                    {
                        isAvailable: true,
                        isBooked: false,
                        bookingId: null,
                    },
                    {
                        headers: { Authorization: token },
                    }
                );
            } catch (err) {
                console.error("⚠️ Failed to update availability:", err.message);
            }
        }

        res.status(200).json({
            message: "Booking deleted and slot released successfully",
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;
