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

  // useEffect(() => {
  //   const token = localStorage.getItem("token");

  //   if (!token) {
  //     router.push("/login");
  //     return;
  //   }

  //   // 📡 Connexion avec le token JWT
  //   const socket = io(process.env.NEXT_PUBLIC_API_URL as string, {
  //     transports: ["websocket"],
  //     auth: {
  //       token,
  //     },
  //   });

  //   socketRef.current = socket;

  //   // const decodedToken = JSON.parse(atob(token.split(".")[1]));
  //   // setUsername(decodedToken.username);
  //   // setColor(decodedToken.color || "#000000");

  //   // 🔄 Récupère l'historique des messages
  //   socket.on("history", (history: Message[]) => {
  //     setMessages(history);
  //   });

  //   socket.on("message", (data: Message) => {
  //     setMessages((prev) => [...prev, data]);
  //   });

  //   // 🔄 Récupère la liste des utilisateurs connectés
  //   socket.on("users", (users: User[]) => {
  //     setConnectedUsers(users);
  //   });

  //   socket.on("userTyping", (user: string) => {
  //     setTypingUsers((prev) => (prev.includes(user) ? prev : [...prev, user]));
  //   });
  //   socket.on("userStopTyping", (user: string) => {
  //     setTypingUsers((prev) => prev.filter((u) => u !== user));
  //   });

  //   socket.on("connect_error", (err) => {
  //     console.error("Erreur de connexion :", err.message);
  //     router.push("/login");
  //   });

  //   return () => {
  //     socket.off("message");
  //     socket.off("users");
  //     socket.off("history");
  //     socket.disconnect();
  //   };
  // }, [router]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    const socket = io(process.env.NEXT_PUBLIC_API_URL as string, {
      transports: ["websocket"],
      auth: { token },
    });

    socketRef.current = socket;

    // Appel à l'API pour récupérer les vraies infos
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Échec récupération user");
        return res.json();
      })
      .then((data) => {
        setUsername(data.username);
        setColor(data.color);
      })
      .catch((err) => {
        console.error("Erreur de profil:", err);
        router.push("/login");
      });

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
    <div className="min-h-screen bg-gray-900 text-white p-4 flex items-center justify-center">
      <div className="w-full max-w-6xl h-[80vh] bg-gray-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col md:flex-row">
        {/* Sidebar utilisateurs */}
        <div className="md:w-1/4 p-4 bg-gray-700 border-r border-gray-600 flex flex-col">
          <h3 className="text-xl font-bold mb-2">Utilisateurs</h3>
          <p className="text-sm text-gray-300 mb-4">
            {connectedUsers.length} utilisateur(s) connecté(s)
          </p>
          <ul className="overflow-y-auto flex-1 space-y-2 text-sm font-semibold">
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
            className="mt-4 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded text-sm transition"
          >
            Déconnexion
          </button>
        </div>

        {/* Section chat */}
        <div className="md:w-3/4 flex flex-col justify-between p-6">
          {/* En-tête */}
          <div>
            <h2 className="text-2xl font-bold mb-1">
              Bienvenue, <span style={{ color }}>{username}</span> 👋
            </h2>
            <p className="text-sm text-gray-300 mb-3">
              Chattez en temps réel avec les autres utilisateurs.
            </p>
            <div>
              <label className="text-sm text-gray-400">
                Modifie ta couleur :
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
          <div className="flex-1 overflow-y-auto my-4 space-y-3 pr-2 max-h-[300px]">
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
                      <p className="text-xs font-semibold mb-1 text-white/80">
                        {msg.username}
                      </p>
                    )}
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Indicator typing */}
          {typingUsers.length > 0 && (
            <p className="text-sm italic mb-2 text-gray-300">
              {typingUsers.join(", ")} {typingUsers.length > 1 ? "sont" : "est"}{" "}
              en train d’écrire…
            </p>
          )}

          {/* Input + bouton */}
          <div className="flex gap-2">
            <textarea
              placeholder="Entrez votre message..."
              value={message}
              onChange={(e) => handleTyping(e.target.value)}
              className="flex-1 p-3 rounded-lg bg-gray-700 text-white resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
              rows={2}
            />
            <button
              onClick={handleSendMessage}
              disabled={!message.trim()}
              className={`px-6 py-3 rounded text-sm font-semibold transition ${
                message.trim()
                  ? "bg-indigo-500 hover:bg-indigo-600 text-white"
                  : "bg-gray-500 cursor-not-allowed text-white/50"
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
