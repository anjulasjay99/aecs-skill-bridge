import { Schema, model, Document, Types } from "mongoose";

export interface IAvailabilitySlot extends Document {
    mentorId: Types.ObjectId;
    date: string; // e.g. "2025-10-10"
    startTime: string; // "08:00"
    endTime: string; // "09:00"
    isAvailable: boolean; // whether mentor published this slot
    isBooked: boolean; // whether the slot has been reserved
    bookingId?: Types.ObjectId | null;
    createdAt: string;
    updatedAt: string;
}

const AvailabilitySlotSchema = new Schema<IAvailabilitySlot>({
    mentorId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
    },
    date: {
        type: String,
        required: true,
        trim: true,
        match: /^\d{4}-\d{2}-\d{2}$/, // YYYY-MM-DD
    },
    startTime: {
        type: String,
        required: true,
        trim: true,
        match: /^([0-1]\d|2[0-3]):([0-5]\d)$/, // HH:mm
    },
    endTime: {
        type: String,
        required: true,
        trim: true,
        match: /^([0-1]\d|2[0-3]):([0-5]\d)$/,
    },
    isAvailable: {
        type: Boolean,
        default: true,
        index: true,
    },
    isBooked: {
        type: Boolean,
        default: false,
        index: true,
    },
    bookingId: {
        type: Schema.Types.ObjectId,
        ref: "Booking",
        default: null,
    },
    createdAt: {
        type: String,
        trim: true,
    },
    updatedAt: {
        type: String,
        trim: true,
    },
});

// Ensure unique slots per mentor/date/time
AvailabilitySlotSchema.index(
    { mentorId: 1, date: 1, startTime: 1 },
    { unique: true }
);

export const AvailabilitySlot = model<IAvailabilitySlot>(
    "AvailabilitySlot",
    AvailabilitySlotSchema
);
