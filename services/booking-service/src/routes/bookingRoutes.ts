import { Router } from "express";
import {
    createBooking,
    getBookings,
    getBookingById,
    updateBooking,
    deleteBooking,
} from "../services/bookingService.js";

const router = Router();

// Create a new booking
router.post("/", async (req, res) => {
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
router.get("/", async (req, res) => {
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
router.get("/:bookingId", async (req, res) => {
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
router.patch("/:bookingId", async (req, res) => {
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
router.delete("/:bookingId", async (req, res) => {
    const { bookingId } = req.params;

    try {
        const deleted = await deleteBooking(bookingId);
        if (!deleted) {
            return res.status(404).json({ message: "Booking not found" });
        }

        res.status(200).json({ message: "Booking deleted successfully" });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
});

export default router;
