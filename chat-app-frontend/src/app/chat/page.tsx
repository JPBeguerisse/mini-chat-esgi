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
      setTypingUsers(prev =>
        prev.includes(user) ? prev : [...prev, user]
      );
    });
    socket.on("userStopTyping", (user: string) => {
      setTypingUsers(prev => prev.filter(u => u !== user));
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
    <div className="p-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-3xl font-bold">Chat Room</h2>
        <button
          onClick={handleLogout}
          className="bg-red-500 text-white py-2 px-4 rounded hover:bg-red-600 transition"
        >
          Déconnexion
        </button>
      </div>

      <p className="mb-4">
        Connecté en tant que : <strong style={{ color }}>{username}</strong>
      </p>

      <div className="mb-4">
        <label>
          Ta couleur :
          <input type="color" value={color} onChange={e => handleColorChange(e.target.value)} className="ml-2" />
        </label>
      </div>

      <div className="mb-4 max-h-96 overflow-y-auto border rounded p-4">
        {messages.map((msg, i) => (
          <div key={i} className="mb-2">
            <strong style={{ color: msg.color }}>{msg.username}:</strong>{" "}
            <span style={{ color: msg.color }}>{msg.content}</span>
          </div>
        ))}
      </div>

      {/* Indicateur "en train d'écrire" */}
      {typingUsers.length > 0 && (
        <p className="italic mb-2">
          {typingUsers.join(", ")}{" "}
          {typingUsers.length > 1 ? "sont" : "est"} en train d’écrire…
        </p>
      )}

      <div className="flex gap-2 mb-4">
        <input
          type="text"
          placeholder="Entrez votre message…"
          value={message}
          onChange={e => handleTyping(e.target.value)}
          className="flex-1 p-3 border rounded"
        />
        <button
          onClick={handleSendMessage}
          className="bg-blue-500 text-white py-3 px-6 rounded hover:bg-blue-700 transition"
        >
          Envoyer
        </button>
      </div>

      <div>
        <h3 className="text-lg font-bold">Utilisateurs connectés</h3>
        <ul>
          {connectedUsers.map((user, index) => (
            <li key={index} style={{ color: user.color }}>
              {user.username}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
