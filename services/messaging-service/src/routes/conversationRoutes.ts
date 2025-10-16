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

        // Parse participants list
        const participantList = (participants as string)
            .split(",")
            .map((p) => p.trim())
            .filter(Boolean);

        let query = {};

        if (participantList.length === 1) {
            // ✅ If only one user — return all their conversations
            query = {
                participants: participantList[0],
            };
        } else {
            // ✅ If multiple users — return only conversations that include *all* and only them
            query = {
                participants: { $all: participantList },
                $expr: {
                    $eq: [{ $size: "$participants" }, participantList.length],
                },
            };
        }

        const conversations = await Conversation.find(query).lean();

        if (!conversations || conversations.length === 0) {
            return res.status(200).json({ conversations: [] });
        }

        // Attach messages
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
