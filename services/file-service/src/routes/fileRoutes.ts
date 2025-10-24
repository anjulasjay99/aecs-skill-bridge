// @ts-nocheck
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
import { authenticateToken } from "../middleware/authMiddleware.js";

const router = Router();

// Health check
router.get("/", authenticateToken, (_req, res) => {
    res.json({ message: "File endpoint working" });
});

// Get all files for a slot
router.get("/:slotId", authenticateToken, async (req, res) => {
    const { slotId } = req.params;

    try {
        const files = await getFilesSlotById(slotId);
        res.status(200).json({ files });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Create a new file (upload to S3 + save metadata)
router.post("/", authenticateToken, async (req, res) => {
    const { mentorId, menteeId, slotId, fileName, base64 } = req.body;
    const createdAt = new Date().toISOString();

    try {
        const uploaded = await uploadBase64File(base64, "dev-skill-bridge-s3");

        const newFile = await createFile({
            mentorId,
            menteeId,
            slotId,
            fileName,
            fileType: uploaded.fileType,
            url: uploaded.url,
            createdAt,
        });

        res.status(201).json({
            message: "File created successfully",
            file: newFile,
        });
    } catch (error) {
        console.error("❌ File creation error:", error);
        res.status(500).json({ message: error.message });
    }
});

// Delete a file
router.delete("/:fileId", authenticateToken, async (req, res) => {
    const { fileId } = req.params;

    try {
        const file = await getFileById(fileId);
        if (!file) return res.status(404).json({ message: "File not found" });

        const key = getFileKey(file.url);
        await deleteS3File("dev-skill-bridge-s3", key ?? "");

        await deleteFile(fileId);

        res.status(200).json({ message: "File deleted successfully" });
    } catch (error) {
        console.error("❌ File delete error:", error);
        res.status(500).json({ message: error.message });
    }
});

export default router;
