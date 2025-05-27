"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { registerSchema } from "@/utils/schemas";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

type RegisterFormData = z.infer<typeof registerSchema>;

export const COLORS = [
  "#ffffff",
  "#7dd3fc",
  "#2563eb",
  "#737373",
  "#fde047",
  "#fbbf24",
  "#92400e",
  "#374151",
  "#f97316",
  "#f9a8d4",
  "#f43f5e",
  "#84cc16",
  "#15803d",
  "#a855f7",
];

export default function RegisterPage() {
  const [emailError, setEmailError] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const [generalError, setGeneralError] = useState("");
  const router = useRouter();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    try {
      setEmailError("");
      setUsernameError("");
      setGeneralError("");

      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/register`,
        data
      );
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
    <div className="relative isolate bg-gray-900 h-screen md:h-full w-full flex items-center justify-center">
      <div className="mx-auto grid max-w-7xl grid-cols-1 lg:grid-cols-2">
        <div className="relative px-6 pt-24 pb-20 sm:pt-32 lg:static lg:px-8 lg:py-48 flex items-center justify-center">
          <div className="mx-auto max-w-xl lg:mx-0 lg:max-w-lg">
            <div className="absolute inset-y-0 left-0 -z-10 w-full overflow-hidden ring-1 ring-white/5 lg:w-1/2">
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
            <h2 className="text-4xl font-semibold tracking-tight text-pretty text-white sm:text-5xl">
              Inscrivez-vous dès maintenant
            </h2>
            <p className="mt-6 text-lg/8 text-gray-300">
              Remplissez le formulaire ci-dessous pour créer votre compte et rejoindre notre communauté.
            </p>
            <p className="mt-6 text-sm text-gray-300">
              Déjà inscrit ?{" "}
              <a href="/login" className="mt-6 text-sm text-gray-300 underline ml-0 hover:ml-2 transition-all duration-200">
                Se connecter <span aria-hidden="true">→</span>
              </a>
            </p>
            {generalError && (
              <p className="text-red-500 text-sm mt-1 mb-4">{generalError}</p>
            )}
          </div>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="px-6 pt-20 pb-24 sm:pb-32 lg:px-8 lg:py-48">
          <div className="mx-auto max-w-xl lg:mr-0 lg:max-w-lg">
            <div className="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label htmlFor="email" className="block text-sm/6 font-semibold text-white">
                  Email
                </label>
                <div className="mt-2.5">
                  <input
                    type="email"
                    placeholder="text@example.com"
                    {...register("email")}
                    className="block w-full rounded-md bg-white/5 px-3.5 py-2 text-base text-white outline-1 -outline-offset-1 outline-white/10 placeholder:text-gray-500 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-500"
                  />
                  {errors.email && (
                    <p className="text-red-500 text-sm mt-1 pt-2">{errors.email.message}</p>
                  )}
                  {emailError && !errors.email && (
                    <p className="text-red-500 text-sm mt-1 pt-2">{emailError}</p>
                  )}
                </div>
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="username" className="block text-sm/6 font-semibold text-white">
                  Nom d'utilisateur
                </label>
                <div className="mt-2.5">
                  <input
                    type="text"
                    placeholder="Utilisateur123"
                    {...register("username")}
                    className="block w-full rounded-md bg-white/5 px-3.5 py-2 text-base text-white outline-1 -outline-offset-1 outline-white/10 placeholder:text-gray-500 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-500"
                  />
                  {errors.username && (
                    <p className="text-red-500 text-sm mt-1 pt-2">{errors.username.message}</p>
                  )}
                  {usernameError && !errors.username && (
                    <p className="text-red-500 text-sm mt-1 pt-2">{usernameError}</p>
                  )}
                </div>
              </div>
              <div>
                <label htmlFor="password" className="block text-sm/6 font-semibold text-white">
                  Mot de passe
                </label>
                <div className="mt-2.5">
                  <input
                    type="password"
                    placeholder="Mot de passe"
                    {...register("password")}
                    className="block w-full rounded-md bg-white/5 px-3.5 py-2 text-base text-white outline-1 -outline-offset-1 outline-white/10 placeholder:text-gray-500 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-500"
                  />
                  {errors.password && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.password.message}
                    </p>
                  )}
                </div>
              </div>
              <div>
                <label htmlFor="confirmPassword" className="block text-sm/6 font-semibold text-white">
                  Confirmation du mot de passe
                </label>
                <div className="mt-2.5">
                  <input
                    type="password"
                    placeholder="Confirmer le mot de passe"
                    {...register("confirmPassword")}
                    className="block w-full rounded-md bg-white/5 px-3.5 py-2 text-base text-white outline-1 -outline-offset-1 outline-white/10 placeholder:text-gray-500 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-500"
                  />
                  {errors.confirmPassword && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.confirmPassword.message}
                    </p>
                  )}
                </div>
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="color" className="block text-sm/6 font-semibold text-white">
                  Couleur de profil
                </label>
                <div className="mt-2.5 flex flex-wrap gap-2 mb-4">
                  {COLORS.map((color) => (
                    <label key={color} className="cursor-pointer flex items-center justify-center ">
                      <input
                        type="radio"
                        value={color}
                        {...register("color")}
                        className="sr-only"
                      />
                      <div
                        className={`rounded border-2 ${
                          watch("color") === color
                            ? "border-white w-8 h-7 transition-all duration-200"
                            : "border-transparent w-8 h-8 transition-all duration-200"
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    </label>
                  ))}
                </div>
                {errors.color && (
                  <p className="text-red-500 text-sm mt-1">{errors.color.message}</p>
                )}
              </div>
            </div>
            <div className="mt-8 flex justify-end">
              <button
                type="submit"
                className="rounded-md bg-white px-3.5 py-2.5 text-sm font-semibold text-gray-900 shadow-xs hover:bg-gray-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white cursor-pointer md:w-full"
              >
                S'inscrire
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )

  // return (
  //   <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-md">
  //     <h2 className="text-2xl font-bold mb-6 text-center">Inscription</h2>

  //       {generalError && (
  //         <p className="text-red-500 text-sm mt-1 mb-4">{generalError}</p>
  //       )}

  //       <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
  //         {/* Champ email */}
  //         <input
  //           type="email"
  //           placeholder="Email"
  //           {...register("email")}
  //           className="w-full p-3 border rounded"
  //         />
  //         {errors.email && (
  //           <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
  //         )}
  //         {emailError && !errors.email && (
  //           <p className="text-red-500 text-sm mt-1">{emailError}</p>
  //         )}

  //         {/* Champ username */}
  //         <input
  //           type="text"
  //           placeholder="Username"
  //           {...register("username")}
  //           className="w-full p-3 border rounded"
  //         />
  //         {errors.username && (
  //           <p className="text-red-500 text-sm mt-1">{errors.username.message}</p>
  //         )}
  //         {usernameError && !errors.username && (
  //           <p className="text-red-500 text-sm mt-1">{usernameError}</p>
  //         )}

  //         {/* Champ password */}
  //         <input
  //           type="password"
  //           placeholder="Password"
  //           {...register("password")}
  //           className="w-full p-3 border rounded"
  //         />
  //         {errors.password && (
  //           <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>
  //         )}

  //         {/* Champ confirm password */}
  //         <input
  //           type="password"
  //           placeholder="Confirmer le mot de passe"
  //           {...register("confirmPassword")}
  //           className="w-full p-3 border rounded"
  //         />
  //         {errors.confirmPassword && (
  //           <p className="text-red-500 text-sm mt-1">
  //             {errors.confirmPassword.message}
  //           </p>
  //         )}
  //         {/* Champ color */}
  //         <label className="block text-sm font-medium mb-1">Couleur</label>
  //         <div className="flex flex-wrap gap-2 mb-4">
  //           {COLORS.map((color) => (
  //             <label key={color} className="cursor-pointer">
  //               <input
  //                 type="radio"
  //                 value={color}
  //                 {...register("color")}
  //                 className="sr-only"
  //               />
  //               <div
  //                 className={`w-8 h-8 rounded border-2 ${
  //                   watch("color") === color
  //                     ? "border-black"
  //                     : "border-transparent"
  //                 }`}
  //                 style={{ backgroundColor: color }}
  //               />
  //             </label>
  //           ))}
  //         </div>
  //         {errors.color && (
  //           <p className="text-red-500 text-sm mt-1">{errors.color.message}</p>
  //         )}

  //         <button
  //           type="submit"
  //           className="w-full bg-gray-800 text-white py-3 rounded hover:bg-black transition"
  //         >
  //           Register
  //         </button>
  //       </form>
  //       <p className="text-center text-sm mt-4">
  //         Déjà inscrit ?{" "}
  //         <a href="/login" className="text-green-600 hover:underline">
  //           Se connecter
  //         </a>
  //       </p>
  //     </div>
  //   </div>
  // );
}
