// @ts-nocheck
import { Router } from "express";
import { ddb } from "../db/dbClient.js";
import { QueryCommand, ScanCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import { v4 as uuidv4 } from "uuid";

const router = Router();

export const CONVERSATION_TABLE =
    process.env.CONVERSATION_TABLE || "Conversations";
export const MESSAGE_TABLE = process.env.MESSAGE_TABLE || "Messages";

/**
 * GET /conversations?participants=user1,user2
 */
router.get("/", async (req, res) => {
    try {
        const { participants } = req.query;
        if (!participants)
            return res.status(400).json({ message: "Missing participants" });

        const participantList = participants.split(",").map((p) => p.trim());

        const scanRes = await ddb.send(
            new ScanCommand({ TableName: CONVERSATION_TABLE })
        );
        let conversations = scanRes.Items || [];

        // Normalize DynamoDB Sets to arrays
        conversations = conversations.map((conv) => {
            if (conv.participants instanceof Set)
                conv.participants = Array.from(conv.participants);
            return conv;
        });

        // Handle both single and multi participant queries
        if (participantList.length === 1) {
            const participant = participantList[0];
            conversations = conversations.filter((conv) =>
                conv.participants?.includes(participant)
            );
        } else {
            conversations = conversations.filter((conv) => {
                const set = new Set(conv.participants);
                return (
                    participantList.every((p) => set.has(p)) &&
                    set.size === participantList.length
                );
            });
        }

        // Attach messages
        for (const conv of conversations) {
            const msgs = await ddb.send(
                new QueryCommand({
                    TableName: MESSAGE_TABLE,
                    IndexName: "ConversationIndex",
                    KeyConditionExpression: "conversationId = :cid",
                    ExpressionAttributeValues: { ":cid": conv._id },
                })
            );
            conv.messages = msgs.Items?.sort(
                (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
            );
        }

        res.status(200).json({ conversations });
    } catch (err) {
        console.error("Error fetching conversations:", err);
        res.status(500).json({ message: "Internal server error" });
    }
});

/**
 * GET /conversations/:conversationId
 */
router.get("/:conversationId", async (req, res) => {
    try {
        const { conversationId } = req.params;

        // Get conversation
        const convRes = await ddb.send(
            new ScanCommand({
                TableName: CONVERSATION_TABLE,
                FilterExpression: "#id = :cid",
                ExpressionAttributeNames: { "#id": "_id" },
                ExpressionAttributeValues: { ":cid": conversationId },
            })
        );

        const conversation = convRes.Items?.[0];
        if (!conversation)
            return res.status(404).json({ message: "Conversation not found" });

        // Get messages
        const msgRes = await ddb.send(
            new QueryCommand({
                TableName: MESSAGE_TABLE,
                IndexName: "ConversationIndex",
                KeyConditionExpression: "conversationId = :cid",
                ExpressionAttributeValues: { ":cid": conversationId },
            })
        );

        const messages = msgRes.Items?.sort(
            (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
        );

        res.status(200).json({ conversation: { ...conversation, messages } });
    } catch (error) {
        console.error("❌ Error fetching conversation messages:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

export default router;
