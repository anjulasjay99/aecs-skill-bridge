/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import io from "socket.io-client";
import axios from "axios";
import { Loader } from "lucide-react";
import { APIURL, MESSAGING_SERVICE } from "../environments/env";

interface Message {
    _id?: string;
    conversationId?: string;
    senderId: string;
    receiverId: string;
    content: string;
    createdAt?: string;
}

interface Conversation {
    _id: string;
    participants: string[];
    messages: Message[];
    createdAt: string;
}

interface User {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
}

const SOCKET_CONV_EVENTS = [
    "conversationLoaded",
    "conversation",
    "roomReady",
    "joinedRoom",
];

const Messages = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const chatUserId = searchParams.get("userId");

    const [loggedUserId, setLoggedUserId] = useState<string | null>(null);
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [activeConversation, setActiveConversation] =
        useState<Conversation | null>(null);
    const [userCache, setUserCache] = useState<Record<string, User>>({});
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(true);

    const socketRef = useRef<any>(null);
    const messagesEndRef = useRef<HTMLDivElement | null>(null);
    const joinTimeoutRef = useRef<any>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    // ---------- Socket setup ----------
    useEffect(() => {
        const socket = io(MESSAGING_SERVICE, { transports: ["websocket"] });
        socketRef.current = socket;

        const handleReceive = (msg: Message) => {
            setActiveConversation((prev) => {
                if (!prev || msg.conversationId !== prev._id) return prev;
                // prevent dups
                const exists = prev.messages.some(
                    (m) =>
                        m._id === msg._id ||
                        (m.content === msg.content &&
                            m.senderId === msg.senderId &&
                            m.receiverId === msg.receiverId &&
                            !m._id)
                );
                if (exists) return prev;
                return { ...prev, messages: [...prev.messages, msg] };
            });

            setConversations((prev) => {
                const updated = prev.map((c) =>
                    c._id === msg.conversationId
                        ? { ...c, messages: [...c.messages, msg] }
                        : c
                );
                return updated;
            });
        };

        socket.on("receiveMessage", handleReceive);

        // accept any of the possible "conversation ready" events
        const handleAnyConversation = (conv: Conversation) => {
            if (!conv || !conv._id) return;
            setActiveConversation(conv);
            setConversations((prev) => {
                const idx = prev.findIndex((c) => c._id === conv._id);
                if (idx === -1) return [conv, ...prev];
                const copy = [...prev];
                copy[idx] = conv;
                return copy;
            });
            setLoading(false);
            if (joinTimeoutRef.current) {
                clearTimeout(joinTimeoutRef.current);
                joinTimeoutRef.current = null;
            }
        };

        SOCKET_CONV_EVENTS.forEach((evt) =>
            socket.on(evt, handleAnyConversation)
        );

        return () => {
            socket.off("receiveMessage", handleReceive);
            SOCKET_CONV_EVENTS.forEach((evt) =>
                socket.off(evt, handleAnyConversation)
            );
            socket.disconnect();
        };
    }, []);

    // ---------- Load logged user ----------
    useEffect(() => {
        const userData = localStorage.getItem("user");
        const id = userData ? JSON.parse(userData)?.user?._id : null;
        setLoggedUserId(id);
    }, []);

    // ---------- Helpers ----------
    const preloadUser = async (id: string) => {
        if (!id || userCache[id]) return;
        try {
            const res = await axios.get(`${APIURL}/users/${id}`);
            setUserCache((prev) => ({ ...prev, [id]: res.data.user }));
        } catch {
            setUserCache((prev) => ({
                ...prev,
                [id]: {
                    _id: id,
                    firstName: "Unknown",
                    lastName: "",
                    email: "",
                },
            }));
        }
    };

    const fetchConversations = async (userId: string) => {
        try {
            const res = await axios.get(
                `${MESSAGING_SERVICE}/conversations?participants=${userId}`
            );
            const data: Conversation[] = res.data.conversations || [];
            setConversations(data);
            // preload names for sidebar
            const others = Array.from(
                new Set(
                    data.flatMap((c) =>
                        c.participants.filter((pid) => pid !== userId)
                    )
                )
            );
            await Promise.all(others.map(preloadUser));
            setLoading(false);
        } catch (e) {
            console.error("fetchConversations error:", e);
            setLoading(false);
        }
    };

    const findPairConversation = (a: string, b: string) =>
        conversations.find(
            (c) => c.participants.includes(a) && c.participants.includes(b)
        ) || null;

    // ---------- Initial load ----------
    useEffect(() => {
        if (loggedUserId) fetchConversations(loggedUserId);
    }, [loggedUserId]);

    // ---------- Join or create via socket (server-managed) ----------
    useEffect(() => {
        const socket = socketRef.current;
        if (!socket || !loggedUserId || !chatUserId) return;

        setLoading(true);
        preloadUser(chatUserId);

        // emit in both common shapes (compatible with different server handlers)
        try {
            socket.emit("joinChat", loggedUserId, chatUserId);
        } catch {}
        try {
            socket.emit("joinChat", {
                senderId: loggedUserId,
                receiverId: chatUserId,
            });
        } catch {}

        // if server doesn't emit a conversation promptly, fall back to REST to locate it
        if (joinTimeoutRef.current) clearTimeout(joinTimeoutRef.current);
        joinTimeoutRef.current = setTimeout(async () => {
            // try to locate conversation via REST
            try {
                const res = await axios.get(
                    `${MESSAGING_SERVICE}/conversations?participants=${loggedUserId}`
                );
                const data: Conversation[] = res.data.conversations || [];
                setConversations(data);
                const conv = data.find(
                    (c) =>
                        c.participants.includes(loggedUserId) &&
                        c.participants.includes(chatUserId)
                );
                if (conv) {
                    setActiveConversation(conv);
                    setLoading(false);
                    return;
                }
            } catch (e) {
                console.error("fallback conversations fetch error:", e);
            }
            // still nothing—create a stub view with the other user's name so the UI isn't empty
            setActiveConversation({
                _id: "pending-" + loggedUserId + "-" + chatUserId,
                participants: [loggedUserId, chatUserId],
                messages: [],
                createdAt: new Date().toISOString(),
            });
            // also show a stub in sidebar so their name appears
            setConversations((prev) => {
                const exists = prev.some(
                    (c) =>
                        c.participants.includes(loggedUserId) &&
                        c.participants.includes(chatUserId)
                );
                if (exists) return prev;
                return [
                    {
                        _id: "pending-" + loggedUserId + "-" + chatUserId,
                        participants: [loggedUserId, chatUserId],
                        messages: [],
                        createdAt: new Date().toISOString(),
                    },
                    ...prev,
                ];
            });
            setLoading(false);
        }, 1200); // small delay to give the socket a chance first
    }, [chatUserId, loggedUserId]);

    // ---------- Send message ----------
    const sendMessage = () => {
        if (
            !message.trim() ||
            !loggedUserId ||
            !chatUserId ||
            !socketRef.current
        )
            return;

        const convId = activeConversation?._id?.startsWith("pending-")
            ? undefined
            : activeConversation?._id;

        const msg: Message = {
            senderId: loggedUserId,
            receiverId: chatUserId,
            content: message.trim(),
            conversationId: convId,
        };

        socketRef.current.emit("sendMessage", msg);
        setMessage(""); // clear input
    };

    useEffect(() => {
        scrollToBottom();
    }, [activeConversation?.messages]);

    // ---------- Derived UI helpers ----------
    const sortedConversations = useMemo(() => {
        return [...conversations].sort((a, b) => {
            const aTs = new Date(
                a.messages[a.messages.length - 1]?.createdAt || a.createdAt
            ).getTime();
            const bTs = new Date(
                b.messages[b.messages.length - 1]?.createdAt || b.createdAt
            ).getTime();
            return bTs - aTs;
        });
    }, [conversations]);

    // ---------- UI ----------
    return (
        <div className="flex h-screen bg-gray-100">
            {/* LEFT PANEL */}
            <div className="w-1/4 bg-white border-r border-gray-200 flex flex-col">
                <div className="flex-1 overflow-y-auto">
                    {loading && conversations.length === 0 ? (
                        <div className="p-4 text-gray-500 flex items-center">
                            <Loader className="animate-spin mr-2" /> Loading...
                        </div>
                    ) : sortedConversations.length === 0 ? (
                        <p className="text-gray-500 p-4">
                            No conversations yet.
                        </p>
                    ) : (
                        sortedConversations.map((conv) => {
                            const otherId = conv.participants.find(
                                (id) => id !== loggedUserId
                            );
                            const otherUser = otherId
                                ? userCache[otherId]
                                : null;
                            const lastMsg =
                                conv.messages.length > 0
                                    ? conv.messages[conv.messages.length - 1]
                                    : null;
                            return (
                                <div
                                    key={conv._id}
                                    onClick={() =>
                                        navigate(`/messages?userId=${otherId}`)
                                    }
                                    className={`p-4 cursor-pointer hover:bg-blue-50 ${
                                        chatUserId === otherId
                                            ? "bg-blue-100"
                                            : ""
                                    }`}
                                >
                                    <p className="font-medium text-gray-800 truncate">
                                        {otherUser
                                            ? `${otherUser.firstName} ${otherUser.lastName}`
                                            : "Loading..."}
                                    </p>
                                    <p className="text-gray-500 text-sm truncate">
                                        {lastMsg
                                            ? lastMsg.content
                                            : "No messages yet"}
                                    </p>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* RIGHT PANEL */}
            <div className="flex-1 flex flex-col bg-gray-100">
                <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
                    {loading ? (
                        <div className="flex justify-center items-center h-full text-gray-500">
                            <Loader className="animate-spin mr-2" /> Loading
                            chat...
                        </div>
                    ) : activeConversation ? (
                        activeConversation.messages.length > 0 ? (
                            activeConversation.messages.map((msg, index) => (
                                <div
                                    key={msg._id || index}
                                    className={`p-2 rounded-lg max-w-xs ${
                                        msg.senderId === loggedUserId
                                            ? "bg-blue-500 text-white self-end"
                                            : "bg-white text-gray-800 self-start"
                                    }`}
                                >
                                    {msg.content}
                                </div>
                            ))
                        ) : (
                            <p className="text-gray-500 text-center mt-4">
                                Say hi 👋 to start the conversation!
                            </p>
                        )
                    ) : (
                        <p className="text-gray-500 text-center mt-4">
                            Select a chat to start messaging.
                        </p>
                    )}
                    <div ref={messagesEndRef}></div>
                </div>

                {/* INPUT */}
                {chatUserId && (
                    <div className="p-4 bg-white border-t flex items-center flex-shrink-0">
                        <input
                            type="text"
                            placeholder="Type a message..."
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            onKeyDown={(e) =>
                                e.key === "Enter" && sendMessage()
                            }
                            className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none"
                        />
                        <button
                            onClick={sendMessage}
                            className="ml-3 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
                        >
                            Send
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Messages;
