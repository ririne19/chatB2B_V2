"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/src/contexts/AuthContext";

const schema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(8, "Minimum 8 caractères"),
  firstName: z.string().min(1, "Prénom requis"),
  lastName: z.string().min(1, "Nom requis"),
  accountType: z.enum(["agent", "client"]),
  organizationName: z.string().optional(),
  organizationSlug: z.string().optional(),
  role: z.enum(["ADMIN", "MEMBER"]).optional(),
});

type FormData = z.infer<typeof schema>;

export default function RegisterPage() {
  const { register: registerUser } = useAuth();
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      accountType: "client",
      organizationName: "",
      organizationSlug: "",
      role: "MEMBER",
    },
  });

  const watchedAccountType = watch("accountType");

  async function onSubmit(data: FormData) {
    setApiError(null);
    try {
      await registerUser({
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        accountType: data.accountType as "agent" | "client",
        organizationName: data.organizationName || undefined,
        organizationSlug: data.organizationSlug?.trim() || undefined,
        role: data.accountType === "agent" ? (data.role ?? "MEMBER") : "MEMBER",
      });
    } catch (err: unknown) {
      const message =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { error?: string } } }).response?.data
              ?.error
          : "Une erreur est survenue";
      setApiError(message ?? "Une erreur est survenue");
    }
  }

  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 sm:p-8">
          <h1 className="text-2xl font-bold text-slate-900 mb-1">
            Créer un compte
          </h1>
          <p className="text-slate-600 text-sm mb-6">
            Chat B2B après-vente — choisissez votre profil
          </p>

          {apiError && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm">
              {apiError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <span className="block text-sm font-medium text-slate-700 mb-2">
                Je suis
              </span>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    value="client"
                    className="text-blue-600 focus:ring-blue-500"
                    {...register("accountType")}
                  />
                  <span className="text-slate-700">Client (entreprise cliente)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    value="agent"
                    className="text-blue-600 focus:ring-blue-500"
                    {...register("accountType")}
                  />
                  <span className="text-slate-700">Agent (après-vente)</span>
                </label>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                {watchedAccountType === "client"
                  ? "Vous pourrez contacter votre professionnel d'achat / après-vente."
                  : "Vous pourrez répondre aux demandes de vos clients."}
              </p>
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                {...register("email")}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                Mot de passe (min. 8 caractères)
              </label>
              <input
                id="password"
                type="password"
                autoComplete="new-password"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                {...register("password")}
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.password.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="firstName"
                  className="block text-sm font-medium text-slate-700 mb-1"
                >
                  Prénom
                </label>
                <input
                  id="firstName"
                  type="text"
                  autoComplete="given-name"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  {...register("firstName")}
                />
                {errors.firstName && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.firstName.message}
                  </p>
                )}
              </div>
              <div>
                <label
                  htmlFor="lastName"
                  className="block text-sm font-medium text-slate-700 mb-1"
                >
                  Nom
                </label>
                <input
                  id="lastName"
                  type="text"
                  autoComplete="family-name"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  {...register("lastName")}
                />
                {errors.lastName && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.lastName.message}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label
                htmlFor="organizationSlug"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                {watchedAccountType === "agent"
                  ? "Rejoindre l'organisation de mon entreprise (optionnel)"
                  : "Rejoindre mon entreprise existante (optionnel)"}
              </label>
              <input
                id="organizationSlug"
                type="text"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Ex: acme (laissez vide pour créer une nouvelle)"
                {...register("organizationSlug")}
              />
              <p className="mt-1 text-xs text-slate-500">
                {watchedAccountType === "agent"
                  ? "Si votre entreprise est déjà enregistrée, indiquez son identifiant (slug) pour rejoindre l'équipe."
                  : "Si votre entreprise est déjà enregistrée, indiquez son identifiant pour être rattaché à votre professionnel d'achat."}
              </p>
            </div>

            <div>
              <label
                htmlFor="organizationName"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                {watchedAccountType === "agent"
                  ? "Nom de votre entreprise (si vous créez l'organisation)"
                  : "Nom de votre entreprise (si vous ne rejoignez pas une existante)"}
              </label>
              <input
                id="organizationName"
                type="text"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Ex: Ma Société"
                {...register("organizationName")}
              />
            </div>

            {watchedAccountType === "agent" && (
              <div>
                <label
                  htmlFor="role"
                  className="block text-sm font-medium text-slate-700 mb-1"
                >
                  Rôle dans l'équipe après-vente
                </label>
                <select
                  id="role"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  {...register("role")}
                >
                  <option value="MEMBER">Membre (agent)</option>
                  <option value="ADMIN">Administrateur</option>
                </select>
                <p className="mt-1 text-xs text-slate-500">
                  L'administrateur peut gérer les conversations et l'équipe.
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Création...
                </>
              ) : (
                "Créer mon compte"
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-600">
            Déjà un compte ?{" "}
            <Link href="/login" className="text-blue-600 hover:underline">
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
