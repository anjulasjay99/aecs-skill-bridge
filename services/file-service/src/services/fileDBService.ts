import { File as FileDB, IFile } from "../models/FileSchema.js";
import { Types } from "mongoose";

// Create new file
export const createFile = async (data: Partial<IFile>) => {
    const slot = new FileDB(data);
    return await slot.save();
};

export const getFilesSlotById = async (slotId: string) => {
    const query: any = { slotId: new Types.ObjectId(slotId) };

    return await FileDB.find(query);
};

export const getFileById = async (fileId: string) => {
    const query: any = { _id: new Types.ObjectId(fileId) };

    return await FileDB.findOne(query);
};

// Delete a file
export const deleteFile = async (fileId: string) => {
    const result = await FileDB.findByIdAndDelete(fileId);
    return result ? true : false;
};
