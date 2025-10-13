import { Router } from "express";
import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";

const router = Router();

/**
 * GET /conversations?participants=user1,user2
 * Fetch conversations (matching one or more participants)
 * and include messages inside each conversation.
 */
router.get("/", async (req, res) => {
    try {
        const { participants } = req.query;

        if (!participants) {
            return res
                .status(400)
                .json({ message: "Missing participants in query" });
        }

        // Split participants (can be one or many)
        const participantList = (participants as string)
            .split(",")
            .map((p) => p.trim());

        // Find all conversations containing at least one of these participants
        const conversations = await Conversation.find({
            participants: { $in: participantList },
        }).lean();

        if (!conversations || conversations.length === 0) {
            return res.status(200).json({ conversations: null });
        }

        // Attach messages to each conversation
        const populatedConversations = await Promise.all(
            conversations.map(async (conv) => {
                const messages = await Message.find({
                    conversationId: conv._id,
                })
                    .sort({ createdAt: 1 })
                    .lean();
                return { ...conv, messages };
            })
        );

        res.status(200).json({ conversations: populatedConversations });
    } catch (error) {
        console.error("Error fetching conversations:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

/**
 * GET /conversation/:conversationId
 * Fetch all messages for a specific conversation.
 */
router.get("/:conversationId", async (req, res) => {
    try {
        const { conversationId } = req.params;

        const conversation = await Conversation.findById(conversationId).lean();
        if (!conversation) {
            return res.status(404).json({ message: "Conversation not found" });
        }

        const messages = await Message.find({ conversationId })
            .sort({ createdAt: 1 })
            .lean();

        res.status(200).json({ conversation: { ...conversation, messages } });
    } catch (error) {
        console.error("Error fetching conversation messages:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

export default router;
