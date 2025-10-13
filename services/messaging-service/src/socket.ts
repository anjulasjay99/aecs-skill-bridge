import { Server } from "socket.io";
import Message from "./models/Message.js";
import Conversation from "./models/Conversation.js";

export const initSocket = (server: any) => {
    const io = new Server(server, {
        cors: { origin: "*", methods: ["GET", "POST"] },
    });

    io.on("connection", (socket) => {
        console.log("⚡ User connected:", socket.id);

        // Join a private chat (creates conversation if not existing)
        socket.on("joinChat", async (userId1: string, userId2: string) => {
            try {
                const room = [userId1, userId2].sort().join("_");
                socket.join(`chat:${room}`);
                console.log(`📩 ${userId1} joined chat:${room}`);

                // Check if conversation exists for the same participants
                let conversation = await Conversation.findOne({
                    participants: { $all: [userId1, userId2], $size: 2 },
                });

                if (!conversation) {
                    conversation = await Conversation.create({
                        participants: [userId1, userId2],
                        createdAt: new Date().toISOString(),
                    });
                    console.log(`🆕 New conversation created for ${room}`);
                } else {
                    console.log(`🔁 Existing conversation found for ${room}`);
                }

                // Send conversation info back to both users
                io.to(`chat:${room}`).emit("conversationReady", conversation);
            } catch (err) {
                console.error("❌ Error joining chat:", err);
                socket.emit("error", { message: "Failed to join chat" });
            }
        });

        // Send message within conversation
        socket.on(
            "sendMessage",
            async (data: {
                conversationId: string;
                senderId: string;
                receiverId: string;
                content: string;
            }) => {
                try {
                    const { conversationId, senderId, receiverId, content } =
                        data;

                    // Save to DB
                    const msg = await Message.create({
                        conversationId,
                        senderId,
                        receiverId,
                        content,
                        createdAt: new Date().toISOString(),
                    });

                    const room = [senderId, receiverId].sort().join("_");

                    // Send message to both participants
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
