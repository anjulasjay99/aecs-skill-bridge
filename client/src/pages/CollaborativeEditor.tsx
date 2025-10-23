import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import io, { Socket } from "socket.io-client";
import { API_BASE_URL } from "../environments/env";

const SIGNALING_URL = API_BASE_URL;
const MONACO_PATH = "https://cdn.jsdelivr.net/npm/monaco-editor@0.44.0/min/vs";

const LANGUAGES = [
    "javascript",
    "typescript",
    "python",
    "cpp",
    "java",
    "html",
    "css",
    "json",
    "plaintext",
];

const CollaborativeEditor = () => {
    const [searchParams] = useSearchParams();
    const sessionId = searchParams.get("id") || "";

    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const username =
        user?.user?.firstName && user?.user?.lastName
            ? `${user.user.firstName} ${user.user.lastName}`
            : user?.user?.email || "Anonymous";

    const editorRef = useRef<any>(null);
    const monacoRef = useRef<any>(null);
    const socketRef = useRef<Socket | null>(null);
    const peersRef = useRef<Map<string, RTCPeerConnection>>(new Map());
    const channelsRef = useRef<Map<string, RTCDataChannel>>(new Map());

    const [status, setStatus] = useState("Disconnected");
    const [localLang, setLocalLang] = useState("javascript");
    const [messages, setMessages] = useState<
        { sender: string; text: string }[]
    >([]);
    const [chatText, setChatText] = useState("");
    const isApplyingRef = useRef(false);

    const addMsg = (sender: string, text: string) =>
        setMessages((prev) => [...prev, { sender, text }]);
    const addSys = (text: string) =>
        setMessages((prev) => [...prev, { sender: "system", text }]);

    const broadcastJSON = (obj: any) => {
        for (const dc of channelsRef.current.values()) {
            if (dc.readyState === "open") dc.send(JSON.stringify(obj));
        }
    };

    const debounce = (fn: Function, wait = 120) => {
        let t: NodeJS.Timeout;
        return (...args: any[]) => {
            clearTimeout(t);
            t = setTimeout(() => fn(...args), wait);
        };
    };

    // Socket setup
    useEffect(() => {
        const socket = io(SIGNALING_URL, {
            path: "/live",
            transports: ["websocket"],
        });
        socketRef.current = socket;

        socket.on("connect", () => {
            setStatus("Connected");
            if (sessionId) {
                socket.emit("join", { sessionId });
                addSys(`Joining session ${sessionId} as ${username}`);
            }
        });

        socket.on("connect_error", () => setStatus("Connection failed"));
        socket.on("joined", ({ peerCount }) => {
            addSys(`🟢 Joined room`);
            setStatus(`Room: ${peerCount}`);
        });

        socket.on("peer-joined", ({ peerId }) => {
            addSys("👋 New peer joined, creating offer...");
            createPeer(peerId, true);
        });

        socket.on("peer-left", ({ peerId }) => {
            addSys("🚪 A peer left");
            const pc = peersRef.current.get(peerId);
            if (pc) pc.close();
            peersRef.current.delete(peerId);
            channelsRef.current.delete(peerId);
        });

        socket.on("offer", async ({ from, sdp }) => {
            const pc = createPeer(from, false);
            await pc.setRemoteDescription(new RTCSessionDescription(sdp));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            socket.emit("answer", { to: from, sessionId, sdp: answer });
        });

        socket.on("answer", async ({ from, sdp }) => {
            const pc = peersRef.current.get(from);
            if (pc)
                await pc.setRemoteDescription(new RTCSessionDescription(sdp));
        });

        socket.on("ice-candidate", async ({ from, candidate }) => {
            const pc = peersRef.current.get(from);
            if (pc && candidate)
                await pc.addIceCandidate(new RTCIceCandidate(candidate));
        });

        return () => socket.disconnect();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sessionId]);

    //  Peer setup
    const createPeer = (peerId: string, initiator: boolean) => {
        if (peersRef.current.has(peerId)) return peersRef.current.get(peerId)!;

        const socket = socketRef.current!;
        const pc = new RTCPeerConnection({
            iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
        });
        peersRef.current.set(peerId, pc);

        pc.onicecandidate = (e) => {
            if (e.candidate)
                socket.emit("ice-candidate", {
                    sessionId,
                    to: peerId,
                    candidate: e.candidate,
                });
        };

        pc.ondatachannel = (e) => {
            const dc = e.channel;
            channelsRef.current.set(peerId, dc);
            setupDC(dc);
        };

        if (initiator) {
            const dc = pc.createDataChannel("pair-programming");
            channelsRef.current.set(peerId, dc);
            setupDC(dc);
            pc.createOffer().then((o) =>
                pc.setLocalDescription(o).then(() =>
                    socket.emit("offer", {
                        sessionId,
                        to: peerId,
                        sdp: o,
                    })
                )
            );
        }

        return pc;
    };

    const setupDC = (dc: RTCDataChannel) => {
        dc.onopen = () => {
            broadcastJSON({ type: "join", name: username });
            broadcastJSON({ type: "lang", lang: localLang });
            broadcastJSON({
                type: "code",
                content: editorRef.current?.getValue(),
            });
        };

        dc.onmessage = (e) => {
            const msg = JSON.parse(e.data || "{}");
            switch (msg.type) {
                case "code": {
                    const editor = editorRef.current;
                    if (!editor || isApplyingRef.current) break;

                    const incoming = String(msg.content ?? "");
                    const current = editor.getValue();

                    // Ignore if same content
                    if (incoming === current) break;

                    // Preserve cursor position
                    const selection = editor.getSelection();

                    isApplyingRef.current = true;
                    editor.executeEdits("remote", [
                        {
                            range: editor.getModel().getFullModelRange(),
                            text: incoming,
                        },
                    ]);
                    editor.pushUndoStop();

                    // Restore previous cursor position (best-effort)
                    if (selection) editor.setSelection(selection);

                    setTimeout(() => {
                        isApplyingRef.current = false;
                    }, 1);
                    break;
                }

                case "chat":
                    addMsg(msg.name, msg.content);
                    break;
                case "join":
                    addSys(`👋 ${msg.name} joined`);
                    break;
                case "leave":
                    addSys(`🚪 ${msg.name} left`);
                    break;
                case "lang": {
                    const newLang = msg.lang || "plaintext";
                    if (monacoRef.current && editorRef.current) {
                        const currentLang = monacoRef.current.languages
                            .getLanguages()
                            .find(
                                (l: any) =>
                                    l.id ===
                                    editorRef.current.getModel().getLanguageId()
                            )?.id;

                        if (currentLang !== newLang) {
                            isApplyingRef.current = true;
                            setLocalLang(newLang);
                            monacoRef.current.editor.setModelLanguage(
                                editorRef.current.getModel(),
                                newLang
                            );
                            setTimeout(() => {
                                isApplyingRef.current = false;
                            }, 1);
                            //addSys(`🌐 Language switched to ${newLang}`);
                        }
                    }
                    break;
                }
                default:
                    break;
            }
        };

        dc.onclose = () => addSys("⚠️ Channel closed");
    };

    //  Chat
    const sendChat = () => {
        if (!chatText.trim()) return;
        broadcastJSON({ type: "chat", name: username, content: chatText });
        addMsg("You", chatText);
        setChatText("");
    };

    //  Monaco loader fix
    useEffect(() => {
        const loadMonaco = () => {
            if ((window as any).require) {
                initMonaco();
                return;
            }

            const script = document.createElement("script");
            script.src = `${MONACO_PATH}/loader.js`;
            script.onload = () => initMonaco();
            script.onerror = () =>
                console.error("Failed to load Monaco loader");
            document.body.appendChild(script);
        };

        const initMonaco = () => {
            (window as any).require.config({ paths: { vs: MONACO_PATH } });
            (window as any).require(
                ["vs/editor/editor.main"],
                (monaco: any) => {
                    if (editorRef.current) return; // prevent re-init

                    monacoRef.current = monaco;
                    const model = monaco.editor.createModel(
                        "// Start coding here...",
                        localLang
                    );
                    const editor = monaco.editor.create(
                        document.getElementById("editorContainer"),
                        {
                            model,
                            theme: "vs-dark",
                            automaticLayout: true,
                        }
                    );
                    editorRef.current = editor;

                    const broadcastCode = debounce(() => {
                        if (!isApplyingRef.current) {
                            broadcastJSON({
                                type: "code",
                                content: editor.getValue(),
                            });
                        }
                    }, 120);

                    editor.onDidChangeModelContent(() => {
                        if (isApplyingRef.current) return;
                        broadcastCode();
                    });
                }
            );
        };

        loadMonaco();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div className="h-full flex flex-col bg-[#1e1e1e] text-gray-300 font-mono">
            <header className="bg-[#252526] p-2 flex justify-between items-center flex-wrap">
                <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold">{username}</span>
                    <span className="text-gray-400">| Session:</span>
                    <span className="text-blue-400">{sessionId}</span>

                    <select
                        value={localLang}
                        onChange={(e) => {
                            const newLang = e.target.value;
                            if (monacoRef.current && editorRef.current) {
                                isApplyingRef.current = true;
                                setLocalLang(newLang);
                                monacoRef.current.editor.setModelLanguage(
                                    editorRef.current.getModel(),
                                    newLang
                                );
                                broadcastJSON({ type: "lang", lang: newLang });
                                setTimeout(() => {
                                    isApplyingRef.current = false;
                                }, 1);
                            }
                        }}
                        className="px-2 py-1 rounded bg-gray-700 text-white"
                    >
                        {LANGUAGES.map((l) => (
                            <option key={l} value={l}>
                                {l}
                            </option>
                        ))}
                    </select>
                </div>
            </header>

            <main className="flex flex-1 overflow-hidden">
                <div id="editorContainer" className="flex-[3]" />
                <div className="flex-1 flex flex-col border-l border-gray-700 bg-[#252526]">
                    <div className="flex-1 overflow-y-auto p-2 space-y-1">
                        {messages.map((m, i) => (
                            <div
                                key={i}
                                className={
                                    m.sender === "system"
                                        ? "text-blue-400"
                                        : "text-gray-200"
                                }
                            >
                                {m.sender}: {m.text}
                            </div>
                        ))}
                    </div>
                    <div className="flex border-t border-gray-700">
                        <input
                            value={chatText}
                            onChange={(e) => setChatText(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && sendChat()}
                            placeholder="Type message..."
                            className="flex-1 px-2 py-2 bg-[#1e1e1e] text-white border-none focus:outline-none"
                        />
                        <button
                            onClick={sendChat}
                            className="bg-blue-600 hover:bg-blue-700 px-4 py-2"
                        >
                            Send
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default CollaborativeEditor;
