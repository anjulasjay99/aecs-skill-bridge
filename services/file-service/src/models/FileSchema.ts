import { Schema, model, Document, Types } from "mongoose";

export interface IFile extends Document {
    mentorId: Types.ObjectId;
    menteeId: Types.ObjectId;
    slotId: Types.ObjectId;
    fileName: string;
    fileType: string;
    url: string;
    createdAt: string;
}

const FileSchema = new Schema<IFile>({
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
        index: true,
    },
    fileName: {
        type: String,
        trim: true,
    },
    fileType: {
        type: String,
        trim: true,
    },
    url: {
        type: String,
        trim: true,
    },
    createdAt: {
        type: String,
        trim: true,
    },
});

// Ensure unique slots per mentor/date/time
FileSchema.index({ mentorId: 1, menteeId: 1, slotId: 1 }, { unique: true });

export const File = model<IFile>("File", FileSchema);
