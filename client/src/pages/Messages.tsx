import { useEffect, useState, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import io from "socket.io-client";
import axios from "axios";
import { Loader } from "lucide-react";
import { APIURL, MESSAGING_SERVICE, SEARCH_SERVICE } from "../environments/env";

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

const Messages = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const chatUserId = searchParams.get("userId");

    const [loggedUserId, setLoggedUserId] = useState<string | null>(null);
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [userCache, setUserCache] = useState<Record<string, User>>({});
    const [activeConversation, setActiveConversation] =
        useState<Conversation | null>(null);
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(true);

    const socketRef = useRef<any>(null);
    const messagesEndRef = useRef<HTMLDivElement | null>(null);

    // Scroll to bottom helper
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    // ---------------- SOCKET SETUP ----------------
    useEffect(() => {
        const socket = io(MESSAGING_SERVICE, { transports: ["websocket"] });
        socketRef.current = socket;

        // Single listener setup
        const handleReceive = (msg: Message) => {
            setActiveConversation((prev) => {
                if (!prev) return prev;
                if (msg.conversationId !== prev._id) return prev;

                // prevent duplicates
                if (
                    prev.messages.some(
                        (m) =>
                            m._id === msg._id ||
                            (m.content === msg.content &&
                                m.senderId === msg.senderId &&
                                m.receiverId === msg.receiverId)
                    )
                )
                    return prev;

                return { ...prev, messages: [...prev.messages, msg] };
            });

            // move updated conversation to top
            setConversations((prev) => {
                const updated = prev.map((c) =>
                    c._id === msg.conversationId
                        ? { ...c, messages: [...c.messages, msg] }
                        : c
                );
                return updated.sort(
                    (a, b) =>
                        new Date(
                            b.messages[b.messages.length - 1]?.createdAt ||
                                b.createdAt
                        ).getTime() -
                        new Date(
                            a.messages[a.messages.length - 1]?.createdAt ||
                                a.createdAt
                        ).getTime()
                );
            });
        };

        socket.on("receiveMessage", handleReceive);
        return () => {
            socket.off("receiveMessage", handleReceive);
            socket.disconnect();
        };
    }, []);

    // ---------------- LOAD LOGGED USER ----------------
    useEffect(() => {
        const userData = localStorage.getItem("user");
        const id = userData ? JSON.parse(userData)?.user?._id : null;
        setLoggedUserId(id);
    }, []);

    // ---------------- FETCH CONVERSATIONS ----------------
    const fetchConversations = async (userId: string) => {
        try {
            setLoading(true);
            const res = await axios.get(
                `${MESSAGING_SERVICE}/conversations?participants=${userId}`
            );
            let data: Conversation[] = res.data.conversations || [];

            // Sort by most recent message
            data = data.sort(
                (a, b) =>
                    new Date(
                        b.messages[b.messages.length - 1]?.createdAt ||
                            b.createdAt
                    ).getTime() -
                    new Date(
                        a.messages[a.messages.length - 1]?.createdAt ||
                            a.createdAt
                    ).getTime()
            );
            setConversations(data);

            // Preload mentor/user names
            const uniqueIds = Array.from(
                new Set(
                    data.flatMap((c: Conversation) =>
                        c.participants.filter((id) => id !== userId)
                    )
                )
            );

            const usersMap: Record<string, User> = { ...userCache };
            await Promise.all(
                uniqueIds.map(async (id) => {
                    if (!usersMap[id]) {
                        try {
                            const userRes = await axios.get(
                                `${APIURL}/users/${id}`
                            );
                            usersMap[id] = userRes.data.user || {
                                _id: id,
                                firstName: "Unknown",
                                lastName: "",
                                email: "",
                            };
                        } catch {
                            usersMap[id] = {
                                _id: id,
                                firstName: "Unknown",
                                lastName: "",
                                email: "",
                            };
                        }
                    }
                })
            );
            setUserCache(usersMap);

            // ✅ If no userId in URL, auto-select the first chat
            if (!chatUserId && data.length > 0) {
                const firstOtherId = data[0].participants.find(
                    (id) => id !== userId
                );
                navigate(`/messages?userId=${firstOtherId}`);
            }
        } catch (err) {
            console.error("Error loading conversations:", err);
        } finally {
            setLoading(false);
        }
    };

    // ---------------- ACTIVE CHAT SETUP ----------------
    useEffect(() => {
        if (loggedUserId) fetchConversations(loggedUserId);
    }, [loggedUserId]);

    useEffect(() => {
        if (chatUserId && conversations.length > 0 && loggedUserId) {
            const conv = conversations.find(
                (c) =>
                    c.participants.includes(loggedUserId) &&
                    c.participants.includes(chatUserId)
            );
            setActiveConversation(conv || null);
            if (conv)
                socketRef.current.emit("joinChat", loggedUserId, chatUserId);
        }
    }, [chatUserId, conversations, loggedUserId]);

    useEffect(() => {
        scrollToBottom();
    }, [activeConversation?.messages]);

    // ---------------- SEND MESSAGE ----------------
    const sendMessage = () => {
        if (
            !message.trim() ||
            !activeConversation ||
            !loggedUserId ||
            !chatUserId
        )
            return;

        const msg: Message = {
            senderId: loggedUserId,
            receiverId: chatUserId,
            content: message.trim(),
            conversationId: activeConversation._id,
        };

        socketRef.current.emit("sendMessage", msg);
        setMessage("");
    };

    // ---------------- UI ----------------
    return (
        <div className="flex h-screen bg-gray-100">
            {/* LEFT PANE (scrollable) */}
            <div className="w-1/4 bg-white border-r border-gray-200 flex flex-col">
                <div className="flex-1 overflow-y-auto">
                    {loading ? (
                        <div className="p-4 text-gray-500 flex items-center">
                            <Loader className="animate-spin mr-2" /> Loading...
                        </div>
                    ) : conversations.length === 0 ? (
                        <p className="text-gray-500 p-4">
                            No conversations yet.
                        </p>
                    ) : (
                        conversations.map((conv) => {
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
                                            : otherId}
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

            {/* RIGHT PANE (scrollable) */}
            <div className="flex-1 flex flex-col bg-gray-100">
                <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
                    {loading ? (
                        <div className="flex justify-center items-center h-full text-gray-500">
                            <Loader className="animate-spin mr-2" /> Loading
                            chat...
                        </div>
                    ) : activeConversation &&
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
                            No messages yet. Start chatting!
                        </p>
                    )}
                    <div ref={messagesEndRef}></div>
                </div>

                {/* Input */}
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
