"use client";

import { useEffect, useState, Suspense } from "react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { PromoCode } from "@/context/PromoCodeContext";
import AdminLayout from "../components/AdminLayout";
import {
  SpinnerGap,
  ShieldWarning,
  Plus,
  Pencil,
  Trash,
  Ticket,
  X,
  Check,
} from "@phosphor-icons/react";

type PromoForm = Omit<PromoCode, "usedCount">;

const emptyForm: PromoForm = {
  code: "",
  type: "percentage",
  value: 10,
  minPurchase: 0,
  validUntil: Date.now() + 30 * 24 * 60 * 60 * 1000,
  description: "",
};

function PromosPageContent() {
  const { user, loading: authLoading, userRole } = useAuth();
  const toast = useToast();
  const { push } = useRouter();
  const promos = useQuery(api.promoCodes.list);
  const createPromo = useMutation(api.promoCodes.create);
  const updatePromo = useMutation(api.promoCodes.update);
  const removePromo = useMutation(api.promoCodes.remove);

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<PromoForm>(emptyForm);
  const [saving, setSaving] = useState(false);

  const isAdmin = userRole?.isAdmin ?? false;

  useEffect(() => {
    if (!authLoading && !user) push("/login");
  }, [user, authLoading, push]);

  const openModal = (promo?: PromoCode & { id?: string }) => {
    if (promo) {
      setEditingId(promo.id ?? promo.code);
      setForm({
        code: promo.code,
        type: promo.type,
        value: promo.value,
        minPurchase: promo.minPurchase,
        maxDiscount: promo.maxDiscount,
        validUntil: promo.validUntil,
        usageLimit: promo.usageLimit,
        description: promo.description,
        applicableCategories: promo.applicableCategories,
      });
    } else {
      setEditingId(null);
      setForm(emptyForm);
    }
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.code.trim()) {
      toast.error("Code is required");
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        await updatePromo({ id: editingId, patch: form });
        toast.success("Promo code updated");
      } else {
        await createPromo(form);
        toast.success("Promo code created");
      }
      setShowModal(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save promo");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this promo code?")) return;
    try {
      await removePromo({ id });
      toast.success("Promo code deleted");
    } catch {
      toast.error("Failed to delete promo");
    }
  };

  if (authLoading || promos === undefined) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <SpinnerGap className="size-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <AdminLayout title="Promo Codes" activeTab="promos">
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <ShieldWarning className="size-12 text-amber-500 mb-4" />
          <p className="text-gray-600">Admin access required</p>
        </div>
      </AdminLayout>
    );
  }

  const now = Date.now();

  return (
    <AdminLayout
      title="Promo Codes"
      activeTab="promos"
      actions={
        <button
          type="button"
          onClick={() => openModal()}
          className="flex items-center gap-2 bg-white text-black px-4 py-2 text-xs tracking-wider hover:bg-gray-100 transition"
        >
          <Plus className="size-4" />
          NEW CODE
        </button>
      }
    >
      <div className="space-y-4">
        {(promos ?? []).length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Ticket className="size-10 mx-auto mb-3 opacity-40" />
            <p>No promo codes yet. Create one to get started.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-gray-500">
                  <th className="py-3 pr-4">Code</th>
                  <th className="py-3 pr-4">Type</th>
                  <th className="py-3 pr-4">Value</th>
                  <th className="py-3 pr-4">Used</th>
                  <th className="py-3 pr-4">Expires</th>
                  <th className="py-3 pr-4">Status</th>
                  <th className="py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {promos.map((p) => {
                  const expired = p.validUntil < now;
                  const exhausted =
                    p.usageLimit != null && p.usedCount >= p.usageLimit;
                  return (
                    <tr key={p.id} className="border-b border-gray-100">
                      <td className="py-3 pr-4 font-mono font-medium">
                        {p.code}
                      </td>
                      <td className="py-3 pr-4 capitalize">{p.type}</td>
                      <td className="py-3 pr-4">
                        {p.type === "percentage"
                          ? `${p.value}%`
                          : p.type === "fixed"
                            ? `$${p.value}`
                            : "Free ship"}
                      </td>
                      <td className="py-3 pr-4">
                        {p.usedCount}
                        {p.usageLimit != null ? ` / ${p.usageLimit}` : ""}
                      </td>
                      <td className="py-3 pr-4 text-gray-600">
                        {new Date(p.validUntil).toLocaleDateString()}
                      </td>
                      <td className="py-3 pr-4">
                        <span
                          className={`text-xs px-2 py-1 rounded ${
                            expired || exhausted
                              ? "bg-gray-100 text-gray-600"
                              : "bg-green-100 text-green-700"
                          }`}
                        >
                          {expired
                            ? "Expired"
                            : exhausted
                              ? "Limit reached"
                              : "Active"}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openModal(p)}
                            className="p-2 hover:bg-gray-100 rounded"
                            aria-label="Edit"
                          >
                            <Pencil className="size-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(p.id)}
                            className="p-2 hover:bg-red-50 text-red-600 rounded"
                            aria-label="Delete"
                          >
                            <Trash className="size-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/50 p-4">
          <form
            onSubmit={handleSave}
            className="bg-white w-full max-w-lg rounded-lg p-6 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium">
                {editingId ? "Edit promo" : "New promo code"}
              </h2>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="size-5" />
              </button>
            </div>

            <label className="block text-sm">
              <span className="text-gray-600">Code</span>
              <input aria-label="Code" id="page-field-17"
                className="mt-1 w-full border border-gray-200 px-3 py-2 uppercase"
                value={form.code}
                onChange={(e) =>
                  setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))
                }
                disabled={!!editingId}
                required
              />
            </label>

            <div className="grid grid-cols-2 gap-4">
              <label className="block text-sm">
                <span className="text-gray-600">Type</span>
                <select aria-label="Type" id="page-field-18"
                  className="mt-1 w-full border border-gray-200 px-3 py-2"
                  value={form.type}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      type: e.target.value as PromoForm["type"],
                    }))
                  }
                >
                  <option value="percentage">Percentage</option>
                  <option value="fixed">Fixed amount</option>
                  <option value="freeShipping">Free shipping</option>
                </select>
              </label>
              <label className="block text-sm">
                <span className="text-gray-600">Value</span>
                <input aria-label="Value" id="page-field-19"
                  type="number"
                  min={0}
                  className="mt-1 w-full border border-gray-200 px-3 py-2"
                  value={form.value}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      value: Number(e.target.value),
                    }))
                  }
                />
              </label>
            </div>

            <label className="block text-sm">
              <span className="text-gray-600">Description</span>
              <input aria-label="Description" id="page-field-20"
                className="mt-1 w-full border border-gray-200 px-3 py-2"
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
                required
              />
            </label>

            <div className="grid grid-cols-2 gap-4">
              <label className="block text-sm">
                <span className="text-gray-600">Min purchase ($)</span>
                <input aria-label="Min purchase ($)" id="page-field-21"
                  type="number"
                  min={0}
                  className="mt-1 w-full border border-gray-200 px-3 py-2"
                  value={form.minPurchase}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      minPurchase: Number(e.target.value),
                    }))
                  }
                />
              </label>
              <label className="block text-sm">
                <span className="text-gray-600">Usage limit (optional)</span>
                <input aria-label="Usage limit (optional)" id="page-field-22"
                  type="number"
                  min={1}
                  className="mt-1 w-full border border-gray-200 px-3 py-2"
                  value={form.usageLimit ?? ""}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      usageLimit: e.target.value
                        ? Number(e.target.value)
                        : undefined,
                    }))
                  }
                />
              </label>
            </div>

            <label className="block text-sm">
              <span className="text-gray-600">Valid until</span>
              <input aria-label="Valid until" id="page-field-23"
                type="date"
                className="mt-1 w-full border border-gray-200 px-3 py-2"
                value={new Date(form.validUntil).toISOString().slice(0, 10)}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    validUntil: new Date(e.target.value).getTime(),
                  }))
                }
                required
              />
            </label>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-sm border border-gray-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 text-sm bg-gray-950 text-white disabled:opacity-50"
              >
                {saving ? (
                  <SpinnerGap className="size-4 animate-spin" />
                ) : (
                  <Check className="size-4" />
                )}
                Save
              </button>
            </div>
          </form>
        </div>
      )}
    </AdminLayout>
  );
}

export default function AdminPromosPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[60vh] flex items-center justify-center">
          <SpinnerGap className="size-8 animate-spin text-gray-400" />
        </div>
      }
    >
      <PromosPageContent />
    </Suspense>
  );
}
