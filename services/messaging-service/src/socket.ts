// @ts-nocheck
import { Server } from "socket.io";
import { ddb, CONVERSATION_TABLE, MESSAGE_TABLE } from "./db/dbClient.js";
import { PutCommand, QueryCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { v4 as uuidv4 } from "uuid";

export const initSocket = (server: any) => {
    const io = new Server(server, {
        cors: { origin: "*", methods: ["GET", "POST"] },
        path: "/socket.io",
        transports: ["websocket", "polling"],
    });

    io.on("connection", (socket) => {
        console.log("⚡ User connected:", socket.id);

        // Join chat between two users
        socket.on("joinChat", async (userId1: string, userId2: string) => {
            try {
                const room = [userId1, userId2].sort().join("_");
                socket.join(`chat:${room}`);
                console.log(`📩 ${userId1} joined chat:${room}`);

                // Check if conversation already exists
                const scanRes = await ddb.send(
                    new ScanCommand({
                        TableName: CONVERSATION_TABLE,
                        FilterExpression:
                            "contains(participants, :u1) AND contains(participants, :u2)",
                        ExpressionAttributeValues: {
                            ":u1": userId1,
                            ":u2": userId2,
                        },
                    })
                );

                let conversation;
                if (scanRes.Items?.length > 0) {
                    conversation = scanRes.Items[0];
                    console.log(`🔁 Existing conversation found for ${room}`);
                } else {
                    // Create a new conversation
                    const conversationId = uuidv4();
                    const createdAt = new Date().toISOString();

                    await ddb.send(
                        new PutCommand({
                            TableName: CONVERSATION_TABLE,
                            Item: {
                                conversationId,
                                participants: [userId1, userId2],
                                createdAt,
                            },
                        })
                    );

                    conversation = {
                        conversationId,
                        participants: [userId1, userId2],
                        createdAt,
                    };
                    console.log(`🆕 New conversation created for ${room}`);
                }

                io.to(`chat:${room}`).emit("conversationReady", conversation);
            } catch (err) {
                console.error("❌ Error joining chat:", err);
                socket.emit("error", { message: "Failed to join chat" });
            }
        });

        // Send and broadcast messages
        socket.on(
            "sendMessage",
            async ({
                conversationId,
                senderId,
                receiverId,
                content,
            }: {
                conversationId: string;
                senderId: string;
                receiverId: string;
                content: string;
            }) => {
                try {
                    const messageId = uuidv4();
                    const createdAt = new Date().toISOString();

                    await ddb.send(
                        new PutCommand({
                            TableName: MESSAGE_TABLE,
                            Item: {
                                messageId,
                                conversationId,
                                senderId,
                                receiverId,
                                content,
                                createdAt,
                            },
                        })
                    );

                    const room = [senderId, receiverId].sort().join("_");

                    io.to(`chat:${room}`).emit("receiveMessage", {
                        messageId,
                        conversationId,
                        senderId,
                        receiverId,
                        content,
                        createdAt,
                    });
                } catch (err) {
                    console.error("❌ Error sending message:", err);
                    socket.emit("error", { message: "Failed to send message" });
                }
            }
        );

        socket.on("disconnect", () => {
            console.log("❌ User disconnected:", socket.id);
        });
    });
};
