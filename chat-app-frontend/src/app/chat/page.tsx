"use client";

import { useEffect, useState, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { useRouter } from "next/navigation";

interface Message {
  id: number;
  username: string;
  content: string;
  color: string;
}

interface User {
  username: string;
  color: string;
  lastSeen?: number;
}

interface UserSeen {
  username: string;
  color: string;
  lastSeen: number;
}

export default function ChatPage() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [userSeens, setUserSeens] = useState<Record<string, UserSeen>>({});
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
      if (history.length > 0) {
        const lastId = history[history.length - 1].id;
        socket.emit("messageSeen", lastId);
      }
    });

    socket.on("message", (data: any) => {
      const msg: Message = {
        id: data.id ?? data.messageId,
        username: data.username,
        content: data.content,
        color: data.color,
      };
      setMessages(prev => [...prev, msg]);
      socket.emit("messageSeen", msg.id);
    });

    // 🔄 Récupère la liste des utilisateurs connectés
    socket.on("users", (users: User[]) => {
      setConnectedUsers(users);
      // initialise les seens passés pour les autres
      setUserSeens(prev => {
        const next = { ...prev };
        users.forEach(user => {
          if (user.lastSeen !== undefined && user.username !== username) {
            next[user.username] = {
              username: user.username,
              color: user.color,
              lastSeen: user.lastSeen,
            };
          }
        });
        return next;
      });
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

    socket.on("userSeen", (u: UserSeen) => {
      setUserSeens(prev => ({ ...prev, [u.username]: u }));
    });

    return () => {
      socket.off("message");
      socket.off("users");
      socket.off("history");
      socket.off("userSeen");
      socket.off("userTyping");
      socket.off("userStopTyping");
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
                Moifie ta couleur :
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
            {messages.map((msg) => {
              const isMe = msg.username === username;
              const seens = Object.values(userSeens).filter(
                user =>
                  user.lastSeen === msg.id
                  && user.username !== msg.username
                  && user.username !== username
              );

              return (
                <div
                  key={msg.id}
                >
                  <div className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                    {/* Bulle */}
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

                  {/* Cercles “vu” sous la bulle */}
                  {seens.length > 0 && (
                    <div className={`flex space-x-1 mt-1 ml-2 ${isMe ? "justify-end" : "justify-start"}`}>
                      {seens.map(user => (
                        <div key={user.username} className="flex items-center space-x-0.5" title={`${user.username} a vu`}>
                          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: user.color }} />
                          <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 16 16" fill="none" className="w-2 h-2" style={{ color: user.color }}>
                            <path d="M6 10.17L3.53 7.7a.5.5 0 0 0-.7.7l3 3a.5.5 0 0 0 .7 0l6-6a.5.5 0 1 0-.7-.7L6 10.17z" fill="currentColor" />
                          </svg>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div>
            {/* Indicateur "en train d'écrire" */}
            {typingUsers.length > 0 && (
              <p className="italic mb-2">
                {typingUsers.join(", ")}{" "}
                {typingUsers.length > 1 ? "sont" : "est"} en train d’écrire…
              </p>
            )}
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
