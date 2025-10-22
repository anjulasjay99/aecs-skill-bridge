/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import { Loader } from "lucide-react";
import { API_BASE_URL } from "../environments/env";
import { socket } from "../socketClient";

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
    "conversationReady",
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
    const [isConnected, setIsConnected] = useState(socket.connected);

    const messagesEndRef = useRef<HTMLDivElement | null>(null);
    const joinTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const joinedWithRef = useRef<Set<string>>(new Set()); // ✅ guard duplicate joins

    // ---------- Scroll ----------
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

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
            const res = await axios.get(`${API_BASE_URL}/users/${id}`);
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

    const normalizeConversations = (arr: any[]): Conversation[] =>
        (arr || []).map((c: any) => ({ ...c, messages: c.messages || [] }));

    const joinWith = (counterpartId: string) => {
        if (!loggedUserId || !counterpartId || !socket.connected) return;
        if (joinedWithRef.current.has(counterpartId)) return;
        socket.emit("joinChat", loggedUserId, counterpartId);
        joinedWithRef.current.add(counterpartId);
    };

    const fetchConversations = async (userId: string) => {
        const res = await axios.get(
            `${API_BASE_URL}/conversations?participants=${userId}`
        );
        return normalizeConversations(res.data.conversations || []);
    };

    // ---------- Socket setup ----------
    useEffect(() => {
        const handleConnect = async () => {
            setIsConnected(true);

            // ✅ After hard refresh: fetch from server and join ALL rooms immediately
            if (loggedUserId) {
                try {
                    const data = await fetchConversations(loggedUserId);
                    // store in state (doesn't block joining)
                    setConversations((prev) => (prev.length ? prev : data));

                    const others = Array.from(
                        new Set(
                            data.flatMap((c) =>
                                c.participants.filter(
                                    (pid) => pid !== loggedUserId
                                )
                            )
                        )
                    );
                    others.forEach((otherId) => joinWith(otherId));
                } catch (e) {
                    console.error("join-all after connect failed:", e);
                }
            }

            // Also ensure active chat joins
            if (loggedUserId && chatUserId) joinWith(chatUserId);
        };

        const handleDisconnect = () => {
            setIsConnected(false);
            joinedWithRef.current.clear();
        };

        const handleReceive = (msg: Message) => {
            // ✅ Only dedupe by _id; allow identical texts like "hi" twice
            setActiveConversation((prev) => {
                if (!prev) return prev;

                const belongsHere =
                    msg.conversationId === prev._id ||
                    (prev._id.startsWith("pending-") &&
                        ((msg.senderId === loggedUserId &&
                            msg.receiverId === chatUserId) ||
                            (msg.senderId === chatUserId &&
                                msg.receiverId === loggedUserId)));

                if (!belongsHere) return prev;

                const exists = prev.messages.some(
                    (m) => m._id && m._id === msg._id
                );
                if (exists) return prev;

                return { ...prev, messages: [...prev.messages, msg] };
            });

            setConversations((prev) =>
                prev.map((c) =>
                    c._id === msg.conversationId
                        ? {
                              ...c,
                              messages: c.messages?.some(
                                  (m) => m._id && m._id === msg._id
                              )
                                  ? c.messages
                                  : [...(c.messages || []), msg],
                          }
                        : c
                )
            );
        };

        const handleAnyConversation = async (conv: Conversation) => {
            if (!conv || !conv._id) return;

            try {
                const res = await axios.get(
                    `${API_BASE_URL}/conversations/${conv._id}`
                );
                const fullConv: Conversation = {
                    ...res.data.conversation,
                    messages: res.data.conversation?.messages || [],
                };

                setActiveConversation(fullConv);
                setConversations((prev) => {
                    const idx = prev.findIndex((c) => c._id === fullConv._id);
                    if (idx === -1) return [fullConv, ...prev];
                    const copy = [...prev];
                    copy[idx] = fullConv;
                    return copy;
                });
            } catch (err) {
                console.error("fetch full conversation failed:", err);
                setActiveConversation({
                    ...conv,
                    messages: conv.messages || [],
                });
            } finally {
                setLoading(false);
                if (joinTimeoutRef.current) {
                    clearTimeout(joinTimeoutRef.current);
                    joinTimeoutRef.current = null;
                }
            }
        };

        socket.on("connect", handleConnect);
        socket.on("disconnect", handleDisconnect);
        socket.on("receiveMessage", handleReceive);
        SOCKET_CONV_EVENTS.forEach((evt) =>
            socket.on(evt, handleAnyConversation)
        );

        return () => {
            socket.off("connect", handleConnect);
            socket.off("disconnect", handleDisconnect);
            socket.off("receiveMessage", handleReceive);
            SOCKET_CONV_EVENTS.forEach((evt) =>
                socket.off(evt, handleAnyConversation)
            );
        };
    }, [loggedUserId, chatUserId]);

    // ---------- Initial load into state (also used for sidebar + auto-select) ----------
    useEffect(() => {
        (async () => {
            if (!loggedUserId) return;
            try {
                const data = await fetchConversations(loggedUserId);
                setConversations(data);

                // Preload names
                const others = Array.from(
                    new Set(
                        data.flatMap((c) =>
                            c.participants.filter((pid) => pid !== loggedUserId)
                        )
                    )
                );
                await Promise.all(others.map(preloadUser));
                setLoading(false);

                // Auto-select latest if none in URL
                if (data.length > 0 && !chatUserId) {
                    const sorted = [...data].sort((a, b) => {
                        const aTime = new Date(
                            a.messages[a.messages.length - 1]?.createdAt ||
                                a.createdAt
                        ).getTime();
                        const bTime = new Date(
                            b.messages[b.messages.length - 1]?.createdAt ||
                                b.createdAt
                        ).getTime();
                        return bTime - aTime;
                    });
                    const latest = sorted[0];
                    const otherId = latest.participants.find(
                        (id) => id !== loggedUserId
                    );
                    if (otherId) navigate(`/messages?userId=${otherId}`);
                }
            } catch (e) {
                console.error("initial fetch error:", e);
                setLoading(false);
            }
        })();
    }, [loggedUserId]);

    // ---------- URL/user change: join active chat, fallback to REST if no socket event ----------
    useEffect(() => {
        if (!socket.connected || !loggedUserId || !chatUserId) return;
        joinWith(chatUserId);
        preloadUser(chatUserId);

        joinTimeoutRef.current = setTimeout(async () => {
            try {
                const data = await fetchConversations(loggedUserId);
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
                console.error("fallback conv fetch error:", e);
            }

            const stub: Conversation = {
                _id: `pending-${loggedUserId}-${chatUserId}`,
                participants: [loggedUserId, chatUserId],
                messages: [],
                createdAt: new Date().toISOString(),
            };
            setActiveConversation(stub);
            setConversations((prev) =>
                prev.some(
                    (c) =>
                        c.participants.includes(loggedUserId) &&
                        c.participants.includes(chatUserId)
                )
                    ? prev
                    : [stub, ...prev]
            );
            setLoading(false);
        }, 2000);

        return () => {
            if (joinTimeoutRef.current) {
                clearTimeout(joinTimeoutRef.current);
                joinTimeoutRef.current = null;
            }
        };
    }, [chatUserId, loggedUserId]);

    // ---------- Ensure rejoin once all are ready (covers race after refresh) ----------
    useEffect(() => {
        if (isConnected && loggedUserId && chatUserId) {
            joinWith(chatUserId);
        }
    }, [isConnected, loggedUserId, chatUserId]);

    useEffect(() => {
        scrollToBottom();
    }, [activeConversation?.messages]);

    const canSend =
        isConnected &&
        message.trim().length > 0 &&
        activeConversation &&
        !activeConversation._id.startsWith("pending-"); // ✅ wait until real conversation id exists

    const sendMessage = () => {
        if (!canSend || !loggedUserId || !chatUserId) {
            if (!isConnected)
                console.error("❌ Cannot send message - socket not connected");
            return;
        }

        const msg: Message = {
            senderId: loggedUserId,
            receiverId: chatUserId,
            content: message.trim(),
            conversationId: activeConversation?._id,
        };

        socket.emit("sendMessage", msg);
        setMessage("");
    };

    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

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

    return (
        <div className="flex flex-1 h-full bg-gray-100">
            {/* LEFT PANEL (scrollable) */}
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
                            const msgs = conv.messages || [];
                            const otherId = conv.participants.find(
                                (id) => id !== loggedUserId
                            );
                            const otherUser = otherId
                                ? userCache[otherId]
                                : null;
                            const lastMsg =
                                msgs.length > 0 ? msgs[msgs.length - 1] : null;
                            return (
                                <div
                                    key={conv._id}
                                    onClick={() =>
                                        navigate(`/messages?userId=${otherId}`)
                                    }
                                    className={`p-4 cursor-pointer hover:bg-blue-50 border-b border-gray-100 ${
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
                {!isConnected && (
                    <div className="bg-yellow-100 text-yellow-800 px-4 py-2 text-sm text-center">
                        Reconnecting...
                    </div>
                )}

                {/* Messages (scrollable) */}
                <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
                    {loading ? (
                        <div className="flex justify-center items-center h-full text-gray-500">
                            <Loader className="animate-spin mr-2" /> Loading
                            chat...
                        </div>
                    ) : activeConversation ? (
                        (activeConversation.messages ?? []).length > 0 ? (
                            (activeConversation.messages ?? []).map(
                                (msg, index) => (
                                    <div
                                        key={msg._id || `msg-${index}`}
                                        className={`p-3 rounded-lg max-w-xs break-words ${
                                            msg.senderId === loggedUserId
                                                ? "bg-blue-500 text-white self-end"
                                                : "bg-white text-gray-800 self-start shadow-sm"
                                        }`}
                                    >
                                        {msg.content}
                                    </div>
                                )
                            )
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

                {/* Fixed input */}
                {chatUserId && (
                    <div className="p-4 bg-white border-t flex items-center gap-3 flex-shrink-0">
                        <input
                            type="text"
                            placeholder="Type a message..."
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            onKeyDown={handleKeyPress}
                            disabled={
                                !isConnected ||
                                !activeConversation ||
                                activeConversation._id.startsWith("pending-")
                            }
                            className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                        />
                        <button
                            onClick={sendMessage}
                            disabled={!canSend}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
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
