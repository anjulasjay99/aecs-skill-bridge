import {
    AvailabilitySlot,
    IAvailabilitySlot,
} from "../models/AvailabilitySlot.js";
import { Types } from "mongoose";

// Create new availability slot
export const createAvailabilitySlot = async (
    data: Partial<IAvailabilitySlot>
) => {
    const slot = new AvailabilitySlot(data);
    return await slot.save();
};

// Get slots for a mentor (optionally filter by date or availability)
export const getAvailabilitySlots = async (
    mentorId: string,
    filters?: { date?: string; isAvailable?: boolean; isBooked?: boolean }
) => {
    const query: any = { mentorId: new Types.ObjectId(mentorId) };

    if (filters?.date) query.date = filters.date;
    if (filters?.isAvailable !== undefined)
        query.isAvailable = filters.isAvailable;
    if (filters?.isBooked !== undefined) query.isBooked = filters.isBooked;

    return await AvailabilitySlot.find(query).sort({ date: 1, startTime: 1 });
};

export const getSlotById = async (slotId: string) => {
    const query: any = { _id: new Types.ObjectId(slotId) };

    return await AvailabilitySlot.findOne(query);
};

// Update a slot (PATCH)
export const updateAvailabilitySlot = async (
    slotId: string,
    updateData: Partial<IAvailabilitySlot>
) => {
    return await AvailabilitySlot.findByIdAndUpdate(
        slotId,
        { $set: updateData },
        { new: true }
    );
};

// Delete a slot
export const deleteAvailabilitySlot = async (slotId: string) => {
    const result = await AvailabilitySlot.findByIdAndDelete(slotId);
    return result ? true : false;
};
