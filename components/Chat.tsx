import { useEffect, useState, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { Send, User as UserIcon, X, Rocket, ShieldAlert } from "lucide-react";
import { ChatMessage, User } from "../utils/types";
import { storage } from "../utils/storage";
import { format } from "date-fns";

interface ChatProps {
    taskId: string;
    currentUser: User;
    onClose: () => void;
}

export default function Chat({ taskId, currentUser, onClose }: ChatProps) {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState("");
    const socketRef = useRef<Socket | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Initialize socket connection
        fetch("/api/socket"); // Ensure socket server is initialized
        const socket = io({
            path: "/api/socket",
        });
        socketRef.current = socket;

        socket.emit("join-room", taskId);

        socket.on("new-message", (msg: ChatMessage) => {
            setMessages((prev) => [...prev, msg]);
        });

        // Load history from Firestore (if we had it)
        const loadHistory = async () => {
            const history = await storage.getChatMessages(taskId);
            setMessages(history);
        }
        loadHistory();

        return () => {
            socket.disconnect();
        };
    }, [taskId]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const sendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim()) return;

        const message: Omit<ChatMessage, "id"> = {
            taskId,
            senderId: currentUser.id,
            senderName: currentUser.fullName,
            senderRole: currentUser.role,
            text: input.trim(),
            createdAt: new Date().toISOString(),
        };

        // Save to Firestore
        const saved = await storage.saveChatMessage(message);

        // 🔹 Notify workers if the sender is an Admin
        if (currentUser.role === "admin") {
            try {
                const task = await storage.getTaskById(taskId);
                if (task && task.assignedWorkerIds) {
                    await Promise.all(
                        task.assignedWorkerIds.map(workerId => {
                            if (workerId !== currentUser.id) {
                                return storage.createNotification({
                                    userId: workerId,
                                    title: "New Hub Message",
                                    message: `Admin has sent a message in mission: ${task.title}.`,
                                    type: "info",
                                    read: false,
                                    createdAt: new Date().toISOString(),
                                    link: "/dashboard"
                                });
                            }
                            return Promise.resolve();
                        })
                    );
                }
            } catch (e) {
                console.error("Chat notification failed:", e);
            }
        }

        // Send via socket
        socketRef.current?.emit("send-message", saved);
        setInput("");
    };

    return (
        <div className="flex flex-col h-[600px] w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100">
            {/* Header */}
            <div className="flex items-center justify-between p-6 bg-slate-900 text-white">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
                        <Rocket size={20} />
                    </div>
                    <div>
                        <h3 className="font-bold text-lg">Mission Comms</h3>
                        <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Secure Channel</p>
                    </div>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                    <X size={20} />
                </button>
            </div>

            {/* Messages */}
            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50/50"
            >
                <div className="bg-amber-50/50 border border-amber-100/50 p-4 rounded-2xl mb-6 flex items-start gap-4 animate-in fade-in slide-in-from-top-4 duration-700">
                    <ShieldAlert className="text-amber-600 shrink-0" size={18} />
                    <div className="space-y-1">
                        <p className="text-[10px] font-black text-amber-900 uppercase tracking-widest leading-none">Security Protocol</p>
                        <p className="text-[11px] text-amber-800/80 font-bold leading-tight tracking-tight">
                            Communication is monitored. Any policy violation or unprofessional conduct will trigger immediate project termination.
                        </p>
                    </div>
                </div>

                {messages.length === 0 && (
                    <div className="text-center py-20">
                        <p className="text-slate-400 font-medium">No transmissions yet. Start the conversation.</p>
                    </div>
                )}
                {messages.map((msg, idx) => {
                    const isMe = msg.senderId === currentUser.id;
                    const isAdmin = msg.senderRole === 'admin';

                    return (
                        <div key={msg.id || idx} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                            <div className={`flex items-center gap-2 mb-1 ${isMe ? 'flex-row-reverse' : ''}`}>
                                <span className={`text-[10px] font-black uppercase tracking-widest ${isAdmin ? 'text-rose-500' : 'text-indigo-600'}`}>
                                    {isAdmin ? 'Admin' : msg.senderName}
                                </span>
                                <span className="text-[9px] text-slate-400 font-bold">{format(new Date(msg.createdAt), 'HH:mm')}</span>
                            </div>
                            <div className={`max-w-[80%] p-4 rounded-2xl text-sm font-medium shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-300 ${isMe
                                ? 'bg-indigo-600 text-white rounded-tr-none'
                                : 'bg-white text-slate-900 rounded-tl-none border border-slate-100'
                                }`}>
                                {msg.text}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Input */}
            <form onSubmit={sendMessage} className="p-4 bg-white border-t border-slate-100 flex gap-3">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-1 px-6 py-4 bg-slate-50 border-2 border-transparent rounded-2xl outline-none focus:border-indigo-600 focus:bg-white transition-all font-medium text-sm"
                />
                <button
                    type="submit"
                    className="w-14 h-14 bg-indigo-600 text-white rounded-2xl flex items-center justify-center hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 active:scale-95"
                >
                    <Send size={20} />
                </button>
            </form>
        </div>
    );
}
