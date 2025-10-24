// @ts-nocheck
import { Server } from "socket.io";
import { ddb } from "./db/dbClient.js";
import { ScanCommand, PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { v4 as uuidv4 } from "uuid";

export const CONVERSATION_TABLE =
    process.env.CONVERSATION_TABLE || "Conversations";
export const MESSAGE_TABLE = process.env.MESSAGE_TABLE || "Messages";

export const initSocket = (server: any) => {
    const io = new Server(server, {
        cors: { origin: "*", methods: ["GET", "POST"] },
        path: "/socket.io",
        transports: ["websocket", "polling"],
    });

    io.on("connection", (socket) => {
        console.log("⚡ User connected:", socket.id);

        socket.on("joinChat", async (userId1, userId2) => {
            try {
                const room = [userId1, userId2].sort().join("_");
                socket.join(`chat:${room}`);
                console.log(`📩 ${userId1} joined chat:${room}`);

                // Find conversation
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
                    // Create new conversation
                    const newConv = {
                        _id: uuidv4(),
                        participants: [userId1, userId2],
                        createdAt: new Date().toISOString(),
                    };

                    await ddb.send(
                        new PutCommand({
                            TableName: CONVERSATION_TABLE,
                            Item: newConv,
                        })
                    );
                    conversation = newConv;
                    console.log(`🆕 New conversation created for ${room}`);
                }

                io.to(`chat:${room}`).emit("conversationReady", conversation);
            } catch (err) {
                console.error("❌ Error joining chat:", err);
                socket.emit("error", { message: "Failed to join chat" });
            }
        });

        // Send message
        socket.on(
            "sendMessage",
            async ({ conversationId, senderId, receiverId, content }) => {
                try {
                    const msg = {
                        _id: uuidv4(),
                        conversationId,
                        senderId,
                        receiverId,
                        content,
                        createdAt: new Date().toISOString(),
                    };

                    await ddb.send(
                        new PutCommand({
                            TableName: MESSAGE_TABLE,
                            Item: msg,
                        })
                    );

                    const room = [senderId, receiverId].sort().join("_");
                    io.to(`chat:${room}`).emit("receiveMessage", msg);
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
