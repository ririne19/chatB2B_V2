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
  organizationName: z.string().optional(),
  organizationSlug: z.string().optional(),
  role: z.enum(["ADMIN", "MEMBER"]).default("MEMBER"),
  isAdminCompany: z.boolean().optional(),
});

type FormData = z.infer<typeof schema>;

export default function RegisterPage() {
  const { register: registerUser } = useAuth();
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { organizationName: "", organizationSlug: "", role: "MEMBER", isAdminCompany: false },
  });

  async function onSubmit(data: FormData) {
    setApiError(null);
    try {
      await registerUser({
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        organizationName: data.organizationName || undefined,
        organizationSlug: data.organizationSlug?.trim() || undefined,
        role: data.role,
        isAdminCompany: data.isAdminCompany,
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
            Rejoignez la plateforme Chat B2B
          </p>

          {apiError && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm">
              {apiError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
                Rejoindre une organisation existante (optionnel)
              </label>
              <input
                id="organizationSlug"
                type="text"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Ex: acme (laissez vide pour créer une nouvelle)"
                {...register("organizationSlug")}
              />
              <p className="mt-1 text-xs text-slate-500">
                Si vous avez un nom d&apos;organisation (ex: acme), renseignez-le pour voir les mêmes conversations que vos collègues.
              </p>
            </div>

            <div>
              <label
                htmlFor="organizationName"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                Nom de la nouvelle organisation (si vous ne rejoignez pas une existante)
              </label>
              <input
                id="organizationName"
                type="text"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Ex: Ma Société"
                {...register("organizationName")}
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                id="isAdminCompany"
                type="checkbox"
                className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                {...register("isAdminCompany")}
              />
              <label htmlFor="isAdminCompany" className="text-sm text-slate-700">
                Mon entreprise est l&apos;entreprise centrale (les autres pourront nous contacter)
              </label>
            </div>

            <div>
              <label
                htmlFor="role"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                Rôle dans l&apos;organisation
              </label>
              <select
                id="role"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                {...register("role")}
              >
                <option value="MEMBER">Membre (utilisateur)</option>
                <option value="ADMIN">Administrateur</option>
              </select>
              <p className="mt-1 text-xs text-slate-500">
                L&apos;administrateur peut supprimer des conversations.
              </p>
            </div>

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
