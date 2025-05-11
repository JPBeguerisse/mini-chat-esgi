"use client";

import { useEffect, useState, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { useRouter } from "next/navigation";

export default function ChatPage() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<
    { username: string; message: string }[]
  >([]);
  const [connectedUsers, setConnectedUsers] = useState<string[]>([]);
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
    const socket = io("http://localhost:8000", {
      transports: ["websocket"],
      auth: {
        token,
      },
    });

    socketRef.current = socket;

    // 🔄 Récupère le username depuis le token
    const decodedToken = JSON.parse(atob(token.split(".")[1]));
    setUsername(decodedToken.username);

    socket.on("message", (data) => {
      setMessages((prev) => [...prev, data]);
    });

    socket.on("users", (users) => {
      setConnectedUsers(users);
    });

    socket.on("connect_error", (err) => {
      console.error("Erreur de connexion :", err.message);
      router.push("/login");
    });

    return () => {
      socket.off("message");
      socket.off("users");
      socket.disconnect();
    };
  }, [router]);

  const handleSendMessage = () => {
    if (socketRef.current) {
      socketRef.current.emit("message", message);
      setMessage("");
    }
  };

  return (
    <div className="p-8">
      <h2 className="text-3xl font-bold mb-4">Chat Room</h2>

      <p className="mb-4">
        Connecté en tant que : <strong>{username}</strong>
      </p>

      <div className="mb-4">
        <ul>
          {messages.map((msg, index) => (
            <li key={index} className="mb-2">
              <strong>{msg.username}:</strong> {msg.message}
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
          className="bg-green-600 text-white py-3 px-6 rounded hover:bg-green-700 transition"
        >
          Send
        </button>
      </div>

      <div>
        <h3 className="text-lg font-bold">Connected Users:</h3>
        <ul>
          {connectedUsers.map((username, index) => (
            <li key={index} className="mb-1">
              {username}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
