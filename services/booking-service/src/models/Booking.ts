import { Schema, model, Document, Types } from "mongoose";

export interface IBooking extends Document {
    mentorId: Types.ObjectId;
    menteeId: Types.ObjectId;
    slotId: Types.ObjectId;
    payment: number;
    isConfirmed: boolean;
    createdDate: string;
}

const BookingSchema = new Schema<IBooking>({
    mentorId: {
        type: Schema.Types.ObjectId,
        required: true,
        index: true,
    },
    menteeId: {
        type: Schema.Types.ObjectId,
        required: true,
        index: true,
    },
    slotId: {
        type: Schema.Types.ObjectId,
        required: true,
        unique: true, // one booking per slot
    },
    payment: {
        type: Number,
        required: true,
        min: 0,
    },
    isConfirmed: {
        type: Boolean,
        default: false,
    },
    createdDate: {
        type: String,
        required: true,
        trim: true,
    },
});

// Optional index for mentor bookings lookup
BookingSchema.index({ mentorId: 1, isConfirmed: 1 });

export const Booking = model<IBooking>("Booking", BookingSchema);
