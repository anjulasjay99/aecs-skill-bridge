import { Server, Socket } from "socket.io";
import { authSocket } from "./auth.js";
import { log } from "./logger.js";

export function createSignalingServer(httpServer: any, corsOrigins: string[]) {
    const io = new Server(httpServer, {
        cors: { origin: corsOrigins, credentials: true },
    });

    const roomState = new Map<string, Set<string>>(); // roomId -> socket IDs

    io.use(authSocket);

    io.on("connection", (socket: Socket) => {
        log.info("Socket connected:", socket.id);

        socket.on("join", ({ sessionId }: { sessionId: string }) => {
            const roomId = `room:${sessionId}`;
            const set = roomState.get(roomId) || new Set();
            // if (set.size >= 2) {
            //     socket.emit("room-full", { sessionId });
            //     return;
            // }
            socket.join(roomId);
            set.add(socket.id);
            roomState.set(roomId, set);
            socket.emit("joined", { sessionId, peerCount: set.size });
            socket.to(roomId).emit("peer-joined", { peerId: socket.id });
            log.info(`Socket ${socket.id} joined ${roomId} (size=${set.size})`);
        });

        socket.on("offer", ({ sessionId, sdp }) => {
            socket
                .to(`room:${sessionId}`)
                .emit("offer", { sdp, from: socket.id });
        });

        socket.on("answer", ({ sessionId, sdp }) => {
            socket
                .to(`room:${sessionId}`)
                .emit("answer", { sdp, from: socket.id });
        });

        socket.on("ice-candidate", ({ sessionId, candidate }) => {
            socket
                .to(`room:${sessionId}`)
                .emit("ice-candidate", { candidate, from: socket.id });
        });

        socket.on("disconnect", () => {
            for (const roomId of socket.rooms) {
                if (roomId.startsWith("room:")) {
                    cleanupRoom(socket, roomId, roomState);
                }
            }
            log.info("Socket disconnected:", socket.id);
        });
    });

    return io;
}

function cleanupRoom(
    socket: Socket,
    roomId: string,
    roomState: Map<string, Set<string>>
) {
    socket.leave(roomId);
    const set = roomState.get(roomId);
    if (set) {
        set.delete(socket.id);
        if (set.size === 0) roomState.delete(roomId);
        else roomState.set(roomId, set);
    }
    socket.to(roomId).emit("peer-left", { peerId: socket.id });
}
