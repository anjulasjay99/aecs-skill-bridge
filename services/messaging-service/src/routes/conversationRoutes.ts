// @ts-nocheck
import { Router } from "express";
import { ddb, CONVERSATION_TABLE, MESSAGE_TABLE } from "../db/dbClient.js";
import { PutCommand, QueryCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { v4 as uuidv4 } from "uuid";

const router = Router();

/**
 * GET /conversations?participants=user1,user2
 * Fetch conversations between specified participants
 */
router.get("/", async (req, res) => {
    try {
        const { participants } = req.query;
        if (!participants)
            return res.status(400).json({ message: "Missing participants" });

        const participantList = participants.split(",").map((p) => p.trim());

        // Scan all conversations (for small dataset / local dev)
        const scanRes = await ddb.send(
            new ScanCommand({ TableName: CONVERSATION_TABLE })
        );
        let conversations = scanRes.Items || [];

        // Filter by exact participants (2-way chat)
        conversations = conversations.filter((conv) => {
            const set = new Set(conv.participants);
            return (
                participantList.every((p) => set.has(p)) &&
                set.size === participantList.length
            );
        });

        // Attach messages to each conversation
        const populated = [];
        for (const conv of conversations) {
            const msgs = await ddb.send(
                new QueryCommand({
                    TableName: MESSAGE_TABLE,
                    IndexName: "ConversationIndex",
                    KeyConditionExpression: "conversationId = :cid",
                    ExpressionAttributeValues: { ":cid": conv.conversationId },
                })
            );
            conv.messages = msgs.Items?.sort(
                (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
            );
            populated.push(conv);
        }

        res.status(200).json({ conversations: populated });
    } catch (err) {
        console.error("Error fetching conversations:", err);
        res.status(500).json({ message: "Internal server error" });
    }
});

/**
 * GET /conversations/:conversationId
 * Fetch all messages in a conversation
 */
router.get("/:conversationId", async (req, res) => {
    try {
        const { conversationId } = req.params;

        // Get conversation
        const convResult = await ddb.send(
            new ScanCommand({
                TableName: CONVERSATION_TABLE,
                FilterExpression: "conversationId = :cid",
                ExpressionAttributeValues: { ":cid": conversationId },
            })
        );

        if (!convResult.Items?.length)
            return res.status(404).json({ message: "Conversation not found" });

        // Get messages
        const msgResult = await ddb.send(
            new QueryCommand({
                TableName: MESSAGE_TABLE,
                IndexName: "ConversationIndex",
                KeyConditionExpression: "conversationId = :cid",
                ExpressionAttributeValues: { ":cid": conversationId },
            })
        );

        const messages = msgResult.Items?.sort(
            (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
        );

        res.status(200).json({
            conversation: convResult.Items[0],
            messages,
        });
    } catch (err) {
        console.error("Error fetching conversation:", err);
        res.status(500).json({ message: "Internal server error" });
    }
});

/**
 * POST /conversations
 * Create a new conversation manually (optional)
 */
router.post("/", async (req, res) => {
    try {
        const { participants } = req.body;
        if (!participants || participants.length < 2)
            return res
                .status(400)
                .json({ message: "At least two participants are required" });

        const conversationId = uuidv4();
        const createdAt = new Date().toISOString();

        await ddb.send(
            new PutCommand({
                TableName: CONVERSATION_TABLE,
                Item: {
                    conversationId,
                    participants,
                    createdAt,
                },
            })
        );

        res.status(201).json({
            message: "Conversation created successfully",
            conversationId,
        });
    } catch (err) {
        console.error("Error creating conversation:", err);
        res.status(500).json({ message: "Internal server error" });
    }
});

export default router;
