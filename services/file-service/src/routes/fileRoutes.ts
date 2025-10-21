import { Router } from "express";
import {
    createFile,
    deleteFile,
    getFileById,
    getFilesSlotById,
} from "../services/fileDBService.js";
import {
    deleteS3File,
    uploadBase64File,
} from "../services/fileUploadService.js";
import { getFileKey } from "../utils/getFileKey.js";

const router = Router();

// Health check
router.get("/", (_req, res) => {
    res.json({ message: "File endpoint working" });
});

// All files for a slot
router.get("/:slotId", async (req, res) => {
    const { slotId } = req.params;

    try {
        const files = await getFilesSlotById(slotId);

        res.status(200).json({ files });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
});

// Create a new file
router.post("/", async (req, res) => {
    const { mentorId, menteeId, slotId, fileName, base64 } = req.body;
    const createdAt = new Date().toISOString();

    try {
        const uploadedFile = await uploadBase64File(
            base64,
            "dev-skill-bridge-s3"
        );
        const newSlot = await createFile({
            mentorId,
            menteeId,
            slotId,
            url: uploadedFile.url,
            fileName,
            fileType: uploadedFile.fileType,
            createdAt,
        });

        res.status(201).json({
            message: "File created successfully",
            slot: newSlot,
        });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
});

// Remove a slot
router.delete("/:fileId", async (req, res) => {
    const { fileId } = req.params;

    try {
        const file = await getFileById(fileId);
        if (!file) {
            return res.status(404).json({ message: "File not found" });
        }

        const key = getFileKey(file.url);
        await deleteS3File("dev-skill-bridge-s3", key ?? "");

        const deleted = await deleteFile(fileId);
        if (!deleted) {
            return res
                .status(404)
                .json({ message: "Could not delete the file" });
        }

        res.status(200).json({
            message: "File deleted successfully",
        });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
});

export default router;
