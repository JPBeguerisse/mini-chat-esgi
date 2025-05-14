"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const [username, setUsername] = useState("");
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
    } else {
      // Décoder le token pour afficher l'email de l'utilisateur
      const decoded = JSON.parse(atob(token.split(".")[1]));
      console.log(decoded);
      setUsername(decoded.username);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/login");
  };

  return (
    <div className="w-full max-w-2xl p-8 bg-white rounded-lg shadow-md text-center">
      <h1 className="text-4xl font-bold mb-4">Bienvenue sur le Chat App</h1>
      <p className="text-xl mb-4">Bonjour, {username} 👋</p>
      <button
        onClick={() => router.push("/chat")}
        className="bg-blue-500 text-white py-3 px-6 rounded hover:bg-blue-600 transition mr-4"
      >
        Accéder au Chat
      </button>
      <button
        onClick={handleLogout}
        className="bg-gray-800 text-white py-3 px-6 rounded hover:bg-red-700 transition"
      >
        Déconnexion
      </button>
    </div>
  );
}
