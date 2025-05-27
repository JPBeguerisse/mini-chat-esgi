"use client";

import { useEffect, useState, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { useRouter } from "next/navigation";

interface Message {
  username: string;
  content: string;
  color: string;
}

interface User {
  username: string;
  color: string;
}

export default function ChatPage() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [connectedUsers, setConnectedUsers] = useState<User[]>([]);
  const [username, setUsername] = useState("");
  const [color, setColor] = useState("#000000");
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      router.push("/login");
      return;
    }

    // 📡 Connexion avec le token JWT
    const socket = io(process.env.NEXT_PUBLIC_API_URL as string, {
      transports: ["websocket"],
      auth: {
        token,
      },
    });

    socketRef.current = socket;

    const decodedToken = JSON.parse(atob(token.split(".")[1]));
    setUsername(decodedToken.username);
    setColor(decodedToken.color || "#000000");

    // 🔄 Récupère l'historique des messages
    socket.on("history", (history: Message[]) => {
      setMessages(history);
    });

    socket.on("message", (data: Message) => {
      setMessages((prev) => [...prev, data]);
    });

    // 🔄 Récupère la liste des utilisateurs connectés
    socket.on("users", (users: User[]) => {
      setConnectedUsers(users);
    });

    socket.on("userTyping", (user: string) => {
      setTypingUsers((prev) => (prev.includes(user) ? prev : [...prev, user]));
    });
    socket.on("userStopTyping", (user: string) => {
      setTypingUsers((prev) => prev.filter((u) => u !== user));
    });

    socket.on("connect_error", (err) => {
      console.error("Erreur de connexion :", err.message);
      router.push("/login");
    });

    return () => {
      socket.off("message");
      socket.off("users");
      socket.off("history");
      socket.disconnect();
    };
  }, [router]);

  const handleSendMessage = () => {
    if (!message.trim() || !socketRef.current) return;
    socketRef.current.emit("message", message.trim());
    setMessage("");
    // arrêter indicator immédiatement
    socketRef.current.emit("stopTyping");
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    socketRef.current?.disconnect();
    router.push("/login");
  };

  console.log("Messages:", messages);

  const handleTyping = (text: string) => {
    setMessage(text);
    const sock = socketRef.current;
    if (!sock) return;
    sock.emit("typing");
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      sock.emit("stopTyping");
    }, 500);
  };

  const handleColorChange = (c: string) => {
    setColor(c);
    socketRef.current?.emit("updateColor", c);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-white shadow-lg rounded-lg overflow-hidden flex flex-col md:flex-row">
        {/* Utilisateurs connectés */}
        <div className="md:w-1/4 border-r p-4 bg-gray-50 flex flex-col">
          <h3 className="text-lg font-bold">Utilisateurs</h3>
          <p className="text-sm text-gray-500 mb-2">
            {connectedUsers.length} utilisateur(s) connecté(s)
          </p>
          <ul className="space-y-2 text-sm flex-1 overflow-auto font-bold">
            {connectedUsers.map((user, index) => (
              <li
                key={index}
                className="truncate"
                style={{ color: user.color }}
              >
                {user.username}
              </li>
            ))}
          </ul>

          <button
            onClick={handleLogout}
            className="mt-auto bg-gray-800 text-white py-2 px-4 rounded hover:bg-red-600 transition text-sm"
          >
            Déconnexion
          </button>
        </div>

        {/* Chat principal */}
        <div className="md:w-3/4 p-6 flex flex-col justify-between">
          <div className="mb-4">
            <h2 className="text-2xl font-bold mb-2">
              Bienvenue, <strong style={{ color }}>{username}</strong> 👋
            </h2>
            <p className="text-sm text-gray-500">
              Commencez à discuter en temps réel avec les utilisateurs
              connectés.
            </p>
            <div className="mb-4">
              <label>
                Ta couleur :
                <input
                  type="color"
                  value={color}
                  onChange={(e) => handleColorChange(e.target.value)}
                  className="ml-2"
                />
              </label>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto mb-4 space-y-3 max-h-[400px] pr-2">
            {messages.map((msg, index) => {
              const isMe = msg.username === username;

              return (
                <div
                  key={index}
                  className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`p-3 rounded-lg max-w-xs break-words shadow-md text-white ${
                      isMe ? "rounded-br-none" : "rounded-bl-none"
                    }`}
                    style={{ backgroundColor: msg.color }}
                  >
                    {!isMe && (
                      <p className="text-xs font-semibold mb-1 opacity-90">
                        {msg.username}
                      </p>
                    )}
                    <p style={{ whiteSpace: "pre-wrap" }}>{msg.content}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Input message */}
          <div className="flex gap-2 mt-2">
            <textarea
              placeholder="Entrez votre message..."
              value={message}
              onChange={(e) => handleTyping(e.target.value)}
              className="flex-1 p-3 border rounded shadow focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none"
              rows={2}
            />

            {/* Indicateur "en train d'écrire" */}
            {typingUsers.length > 0 && (
              <p className="italic mb-2">
                {typingUsers.join(", ")}{" "}
                {typingUsers.length > 1 ? "sont" : "est"} en train d’écrire…
              </p>
            )}

            <button
              onClick={handleSendMessage}
              disabled={!message.trim()}
              className={`px-6 py-3 rounded text-white transition ${
                message.trim()
                  ? "bg-gray-800 hover:bg-blue-700"
                  : "bg-gray-200 cursor-not-allowed"
              }`}
            >
              Envoyer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
