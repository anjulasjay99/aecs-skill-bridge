import { Booking, IBooking } from "../models/Booking.js";
import { Types } from "mongoose";

// Create booking
export const createBooking = async (data: Partial<IBooking>) => {
    const booking = new Booking(data);
    return await booking.save();
};

// Get bookings (optionally filter by mentorId or menteeId)
export const getBookings = async (filters?: {
    mentorId?: string;
    menteeId?: string;
    slotId?: string;
}) => {
    const query: any = {};
    if (filters?.mentorId)
        query.mentorId = new Types.ObjectId(filters.mentorId);
    if (filters?.menteeId)
        query.menteeId = new Types.ObjectId(filters.menteeId);
    if (filters?.slotId) query.slotId = new Types.ObjectId(filters.slotId);

    return await Booking.find(query)
        .populate("mentorId menteeId slotId")
        .sort({ createdDate: -1 });
};

// Get booking by ID
export const getBookingById = async (bookingId: string) => {
    return await Booking.findById(bookingId).populate(
        "mentorId menteeId slotId"
    );
};

// Update booking (e.g., confirm, modify payment)
export const updateBooking = async (
    bookingId: string,
    updateData: Partial<IBooking>
) => {
    return await Booking.findByIdAndUpdate(
        bookingId,
        { $set: updateData },
        { new: true }
    );
};

// Delete booking
export const deleteBooking = async (bookingId: string) => {
    const result = await Booking.findByIdAndDelete(bookingId);
    return result ? true : false;
};
