"use client";

import { useEffect, useState, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { useRouter } from "next/navigation";

interface Message {
  id: number;
  username: string;
  content: string;
  color: string;
  createdAt?: string;
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
  const bottomRef = useRef<HTMLDivElement | null>(null);

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

    // Appel à l'API pour récupérer les infos
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

    // Récupère l'historique des messages
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
      setMessages((prev) => [...prev, msg]);
      socket.emit("messageSeen", msg.id);
    });

    // Récupère la liste des utilisateurs connectés
    socket.on("users", (users: User[]) => {
      setConnectedUsers(users);
      setUserSeens((prev) => {
        const next = { ...prev };
        users.forEach((user) => {
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
      setUserSeens((prev) => ({ ...prev, [u.username]: u }));
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

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    socket.on("messageDeleted", (id) => {
      setMessages((prev) => prev.filter((m) => m.id !== id));
    });

    return () => {
      socket.off("messageDeleted");
    };
  }, []);

  const handleSendMessage = () => {
    if (!message.trim() || !socketRef.current) return;
    socketRef.current.emit("message", message.trim());
    setMessage("");
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
    <div className="relative isolate overflow-hidden bg-gray-900 w-full h-screen flex justify-center items-center">
      <div className="w-full max-w-4xl min-h-[75vh] md:h-[80vh] bg-gray-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col md:flex-row fixed shadow-indigo-500/50">
        {/* Sidebar utilisateurs */}
        <div className="md:w-1/4 p-4 bg-gray-900 border-r border-gray-800 flex flex-col inset-shadow-sm inset-shadow-gray-900/50">
          <div className="absolute inset-y-0 left-0 -z-10 w-full overflow-hidden ring-1 ring-white/5">
            <svg aria-hidden="true" className="absolute inset-0 size-full mask-[radial-gradient(100%_100%_at_top_right,white,transparent)] stroke-gray-700">
              <defs>
                <pattern x="100%" y={-1} id="54f88622-e7f8-4f1d-aaf9-c2f5e46dd1f2" width={200} height={200} patternUnits="userSpaceOnUse">
                  <path d="M130 200V.5M.5 .5H200" fill="none" />
                </pattern>
              </defs>
              <svg x="100%" y={-1} className="overflow-visible fill-gray-800/20">
                <path d="M-470.5 0h201v201h-201Z" strokeWidth={0} />
              </svg>
              <rect fill="url(#54f88622-e7f8-4f1d-aaf9-c2f5e46dd1f2)" width="100%" height="100%" strokeWidth={0} />
            </svg>
            <div aria-hidden="true" className="absolute top-[calc(100%-13rem)] -left-56 transform-gpu blur-3xl lg:top-[calc(50%-7rem)] lg:left-[max(-14rem,calc(100%-59rem))]">
              <div style={{ clipPath: 'polygon(74.1% 56.1%, 100% 38.6%, 97.5% 73.3%, 85.5% 100%, 80.7% 98.2%, 72.5% 67.7%, 60.2% 37.8%, 52.4% 32.2%, 47.5% 41.9%, 45.2% 65.8%, 27.5% 23.5%, 0.1% 35.4%, 17.9% 0.1%, 27.6% 23.5%, 76.1% 2.6%, 74.1% 56.1%)', }} className="aspect-1155/678 w-288.75 bg-linear-to-br from-[#80caff] to-[#4f46e5] opacity-20" />
            </div>
          </div>
          <div className="flex grow flex-col gap-y-9 overflow-y-auto bg-gray-900 overflow-hidden">
            <div className="flex h-16 shrink-0 items-center pt-8">
              <h2 className="text-2xl font-bold text-white">
                Bienvenue, {username} 👋
              </h2>
            </div>
            <nav className="flex flex-1 flex-col">
              <ul role="list" className="flex flex-1 flex-col gap-y-7">
                <li>
                  <div className="text-xs/6 font-semibold text-gray-600">Utilisateurs connectés</div>
                  <ul role="list" className="-mx-2 mt-2 space-y-1">
                    {connectedUsers.map((user, index) => (
                      <li key={index}>
                        <div
                          className='text-gray-400 hover:bg-gray-800 hover:text-white group flex gap-x-3 rounded-md p-2 text-sm/6 font-semibold'
                        >
                          <span className="flex size-6 shrink-0 items-center justify-center rounded-lg border border-gray-700 text-[0.625rem] font-medium text-gray-400 group-hover:text-white" style={{ backgroundColor: user.color }}>
                          </span>
                          <span className="truncate">{user.username}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </li>
                <li className="mt-auto">
                  <div className="text-xs/6 font-semibold text-gray-600 mb-2">Mon profil</div>
                  <div>
                    <label className="items-center text-gray-400 flex text-sm/6 font-semibold">
                      <input
                        type="color"
                        value={color}
                        onChange={(e) => handleColorChange(e.target.value)}
                        className="mr-2 rounded-full"
                      />
                      Modifie ta couleur
                    </label>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="rounded-md bg-white px-3.5 py-2.5 text-sm font-semibold text-gray-900 shadow-xs hover:bg-gray-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white cursor-pointer md:w-full mt-2"
                  >
                    Déconnexion
                  </button>
                </li>
              </ul>
            </nav>
          </div>
        </div>

        {/* Section chat */}
        <div className="md:w-3/4 flex flex-col justify-between inset-shadow-sm inset-shadow-gray-900/50">
          {/* Messages */}
          <div
            className="flex-1 overflow-y-auto space-y-3 pr-2 max-h-screen"
          >
            {messages.map((msg, index) => {
              const isMe = msg.username === username;
              const msgDate = msg.createdAt ? new Date(msg.createdAt) : null;

              const seens = Object.values(userSeens).filter(
                (user) =>
                  user.lastSeen === msg.id &&
                  user.username !== msg.username &&
                  user.username !== username
              );

              const prevMsg = messages[index - 1];
              const prevDate = prevMsg?.createdAt
                ? new Date(prevMsg.createdAt)
                : null;

              const isNewDay =
                !prevDate ||
                msgDate?.toDateString() !== prevDate?.toDateString();

              return (
                <div key={msg.id} className="px-6">
                  {isNewDay && msgDate && (
                    <div className="text-center text-gray-400 text-sm my-4">
                      {" "}
                      {msgDate.toLocaleDateString("fr-FR", {
                        weekday: "long",
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                      })}
                    </div>
                  )}
                  <div
                    className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                  >
                    <div className={`flex items-end gap-2 ${isMe ? "flex-row-reverse" : "flex-row"}`}>
                      <span className="flex size-6 shrink-0 items-center justify-center rounded-full border border-gray-700 text-[0.625rem] font-medium text-gray-400 group-hover:text-white" style={{ backgroundColor: msg.color }}>
                      </span>
                      <div
                        className={`relative p-3 rounded-lg shadow-cyan-500 max-w-xs break-words shadow-md text-white ${
                          isMe ? "rounded-br-none bg-indigo-500" : "rounded-bl-none bg-gray-700"
                        }`}
                        style={{ boxShadow: `0 15px 80px ${msg.color}`  }}
                      >
                        {!isMe && (
                          <p className="text-xs font-semibold mb-1 opacity-90">
                            {msg.username}
                          </p>
                        )}
                        <p style={{ whiteSpace: "pre-wrap" }}>{msg.content}</p>
                        {isMe && (
                          <button
                            onClick={() => {
                              socketRef.current?.emit("deleteMessage", msg.id);
                            }}
                            className="cursor-pointer absolute top-1 right-1 text-xs text-white/60 hover:text-red-500 font-semibold "
                            aria-label="Supprimer le message"
                            title="Supprimer"
                          >
                            ✖
                          </button>
                        )}
                      </div>
                      {msg.createdAt && (
                        <p className="text-xs text-right text-white/70 mt-1">
                          {new Date(msg.createdAt).toLocaleTimeString("fr-FR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      )}
                    </div>
                  </div>

                  {seens.length > 0 && (
                    <div
                      className={`flex space-x-1 mt-1 ml-2 ${
                        isMe ? "justify-end" : "justify-start"
                      }`}
                    >
                      {seens.map((user) => (
                        <div
                          key={user.username}
                          className="flex items-center space-x-0.5"
                          title={`${user.username} a vu`}
                        >
                          <span
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: user.color }}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>

          {/* Indicateur typing */}
          {typingUsers.length > 0 && (
            <p className="text-sm italic m-2 text-gray-300">
              {typingUsers.join(", ")} {typingUsers.length > 1 ? "sont" : "est"}{" "}
              en train d’écrire…
            </p>
          )}

          <div className="flex gap-2 p-4">
            <textarea
              placeholder="Entrez votre message..."
              value={message}
              onChange={(e) => handleTyping(e.target.value)}
              className="block w-full rounded-full bg-white/5 px-3.5 py-2 text-base text-white outline-1 -outline-offset-1 outline-white/10 placeholder:text-gray-500 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-500"
              rows={1}
            />
            <button
              onClick={handleSendMessage}
              disabled={!message.trim()}
              className={`px-6 py-3 rounded text-sm font-semibold transition ${
                message.trim()
                  ? "bg-indigo-500 hover:bg-indigo-600 text-white"
                  : "bg-gray-700 cursor-not-allowed text-white/50"
              }`}
            >
              Envoyer
            </button>
          </div>
        </div>
      </div>
      <svg
        viewBox="0 0 1024 1024"
        aria-hidden="true"
        className="absolute left-1/2 -z-10 size-256 -translate-x-1/2 mask-[radial-gradient(closest-side,white,transparent)]"
      >
        <circle
          r={512}
          cx={512}
          cy={512}
          fill="url(#8d958450-c69f-4251-94bc-4e091a323369)"
          fillOpacity="0.7"
        />
        <defs>
          <radialGradient id="8d958450-c69f-4251-94bc-4e091a323369">
            <stop stopColor="#7775D6" />
            <stop offset={1} stopColor="#E935C1" />
          </radialGradient>
        </defs>
      </svg>
    </div>
  );
}
