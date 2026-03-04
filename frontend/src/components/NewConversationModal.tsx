"use client";

import { useEffect, useState } from "react";
import { api } from "@/src/lib/axios";
import type { Organization } from "@/src/types";

interface NewConversationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (options: { title?: string; partnerOrganizationSlug?: string }) => Promise<unknown>;
}

export function NewConversationModal({
  isOpen,
  onClose,
  onSubmit,
}: NewConversationModalProps) {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loadingOrgs, setLoadingOrgs] = useState(false);
  const [partnerSlug, setPartnerSlug] = useState("");
  const [title, setTitle] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setLoadingOrgs(true);
    api
      .get<{ success: boolean; data: Organization[] }>("/api/organizations")
      .then((res) => {
        if (res.data.success && res.data.data) {
          setOrganizations(res.data.data);
          setPartnerSlug(res.data.data[0]?.slug ?? "");
        }
      })
      .catch(() => setOrganizations([]))
      .finally(() => setLoadingOrgs(false));
    setTitle("");
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit({
        title: title.trim() || undefined,
        partnerOrganizationSlug: partnerSlug.trim() || undefined,
      });
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-slate-900 mb-4">
          Nouvelle conversation
        </h2>
        <p className="text-sm text-slate-600 mb-4">
          {organizations.some((o) => o.isAdminCompany)
            ? "Ouvrir une conversation avec ENTREPRISE DEMO CLIENT."
            : "Ouvrir une conversation avec ENTREPRISE DEMO Support."}
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="partner" className="block text-sm font-medium text-slate-700 mb-1">
              {organizations.some((o) => o.isAdminCompany)
                ? "Conversation avec"
                : "Contacter"}
            </label>
            {loadingOrgs ? (
              <p className="text-sm text-slate-500">Chargement…</p>
            ) : organizations.length === 0 ? (
              <p className="text-sm text-slate-500">
                Aucune entreprise à contacter pour l&apos;instant.
              </p>
            ) : (
              <select
                id="partner"
                value={partnerSlug}
                onChange={(e) => setPartnerSlug(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              >
                <option value="">— Ne pas associer de partenaire —</option>
                {organizations.map((org) => (
                  <option key={org.id} value={org.slug}>
                    {org.name}
                  </option>
                ))}
              </select>
            )}
          </div>
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-slate-700 mb-1">
              Sujet (optionnel)
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Question après-vente, Commande #123"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg transition-colors"
            >
              {submitting ? "Création…" : "Créer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
