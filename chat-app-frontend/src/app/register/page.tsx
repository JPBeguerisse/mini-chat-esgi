"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { registerSchema } from "@/utils/schemas";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const [emailError, setEmailError] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const [generalError, setGeneralError] = useState("");
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    try {
      setEmailError("");
      setUsernameError("");
      setGeneralError("");

      await axios.post("http://localhost:8000/auth/register", data);
      router.push("/login");
    } catch (error: any) {
      if (error.response && error.response.data.message) {
        const message = error.response.data.message;

        if (message.includes("e-mail")) {
          setEmailError(message);
        } else if (message.includes("nom d'utilisateur")) {
          setUsernameError(message);
        } else {
          setGeneralError(message);
        }
      } else {
        setGeneralError("Erreur inconnue, veuillez réessayer plus tard");
      }
    }
  };

  return (
    <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center">Register</h2>

      {/* Affichage de l'erreur générale (mot de passe, etc.) */}
      {generalError && (
        <p className="text-red-500 text-sm mb-4">{generalError}</p>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Champ email */}
        <input
          type="email"
          placeholder="Email"
          {...register("email")}
          className="w-full p-3 border rounded"
        />
        {errors.email && (
          <p className="text-red-500 text-sm">{errors.email.message}</p>
        )}
        {emailError && !errors.email && (
          <p className="text-red-500 text-sm">{emailError}</p>
        )}

        {/* Champ username */}
        <input
          type="text"
          placeholder="Username"
          {...register("username")}
          className="w-full p-3 border rounded"
        />
        {errors.username && (
          <p className="text-red-500 text-sm">{errors.username.message}</p>
        )}
        {usernameError && !errors.username && (
          <p className="text-red-500 text-sm">{usernameError}</p>
        )}

        {/* Champ password */}
        <input
          type="password"
          placeholder="Password"
          {...register("password")}
          className="w-full p-3 border rounded"
        />
        {errors.password && (
          <p className="text-red-500 text-sm">{errors.password.message}</p>
        )}

        <button
          type="submit"
          className="w-full bg-gray-800 text-white py-3 rounded hover:bg-black transition"
        >
          Register
        </button>
      </form>
      <p className="text-center text-sm mt-4">
        Déjà inscrit ?{" "}
        <a href="/login" className="text-green-600 hover:underline">
          Se connecter
        </a>
      </p>
    </div>
  );
}
