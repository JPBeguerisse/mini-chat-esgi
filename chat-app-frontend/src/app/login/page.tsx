"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { loginSchema } from "@/utils/schemas";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

type loginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [serverError, setServerError] = useState("");
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<loginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: loginFormData) => {
    try {
      const response = await axios.post(
        "http://localhost:8000/auth/login",
        data
      );
      localStorage.setItem("token", response.data.access_token);
      router.push("/");
    } catch (error: any) {
      if (error.response && error.response.data.message) {
        setServerError(error.response.data.message);
      } else {
        setServerError("Erreur inconnue, veuillez réessayer plus tard");
      }
      console.error(error);
    }
  };

  return (
    <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center">Login</h2>
      {serverError && serverError.includes("Erreur inconnue") && (
        <p className="text-red-500 text-sm mb-4">{serverError}</p>
      )}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <input
          type="email"
          placeholder="Email"
          {...register("email")}
          className="w-full p-3 border rounded"
        />
        {errors.email && (
          <p className="text-red-500 text-sm">{errors.email.message}</p>
        )}

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
          Login
        </button>
        {serverError.includes("e-mail") ||
          (serverError.includes("password") && (
            <p className="text-red-500 text-sm">{serverError}</p>
          ))}
      </form>
      <p className="text-center text-sm mt-4">
        Pas encore inscrit ?{" "}
        <a href="/register" className="text-blue-600 hover:underline">
          Créer un compte
        </a>
      </p>
    </div>
  );
}
