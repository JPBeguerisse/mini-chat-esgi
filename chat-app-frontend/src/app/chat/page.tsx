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
  const router = useRouter();
  const socketRef = useRef<Socket | null>(null);

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
    if (socketRef.current) {
      socketRef.current.emit("message", message);
      setMessage("");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    socketRef.current?.disconnect();
    router.push("/login");
  };

  console.log("Messages:", messages);
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
        Connecté en tant que : <strong>{username}</strong>
      </p>

      <div className="mb-4">
        <ul>
          {messages.map((msg, index) => (
            <li key={index} className="mb-2" style={{ color: msg.color }}>
              <strong>{msg.username}:</strong>{" "}
              <span style={{ color: msg.color }}>{msg.content}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex gap-2 mb-4">
        <input
          type="text"
          placeholder="Enter your message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="flex-1 p-3 border rounded"
        />
        <button
          onClick={handleSendMessage}
          className="bg-blue-500  text-white py-3 px-6 rounded hover:bg-blue-700 transition"
        >
          Envoyer
        </button>
      </div>

      <div>
        <h3 className="text-lg font-bold">Utilisateur connectés</h3>
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
