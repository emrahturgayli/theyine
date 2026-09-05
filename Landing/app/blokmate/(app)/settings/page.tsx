"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { getTenantSettings, upsertTenantSettings, type TenantSettings } from "@/lib/blokmate-data";
import { seedDemoData } from "@/lib/blokmate-demo-seed";
import { useBlokmateAuth } from "@/lib/blokmate-auth-context";
import { useBlokmateToast } from "@/lib/blokmate-toast";

/** Manager-only tenant settings — RLS (tenant_settings_update, migration 009) enforces this server-side too. */
export default function SettingsPage() {
  const router = useRouter();
  const { claims, loading: authLoading } = useBlokmateAuth();
  const toast = useBlokmateToast();
  const isManager = claims?.role === "manager";

  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [currency, setCurrency] = useState<TenantSettings["currency"]>(null);
  const [displayName, setDisplayName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [notifyEmail, setNotifyEmail] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [seeding, setSeeding] = useState(false);

  useEffect(() => {
    if (!authLoading && claims && !isManager) {
      router.replace("/blokmate/dashboard");
    }
  }, [authLoading, claims, isManager, router]);

  useEffect(() => {
    if (!isManager) return;
    (async () => {
      try {
        const settings = await getTenantSettings();
        if (settings) {
          setCurrency(settings.currency);
          setDisplayName(settings.display_name ?? "");
          setContactEmail(settings.contact_email ?? "");
          setContactPhone(settings.contact_phone ?? "");
          setNotifyEmail(settings.notify_email);
        }
        setStatus("ready");
      } catch {
        setStatus("error");
      }
    })();
  }, [isManager]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await upsertTenantSettings({
        currency: currency ?? undefined,
        display_name: displayName || undefined,
        contact_email: contactEmail || undefined,
        contact_phone: contactPhone || undefined,
        notify_email: notifyEmail,
      });
      toast.success("Ayarlar kaydedildi.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Bilinmeyen hata");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSeed() {
    if (!window.confirm("Örnek bina, daire, aidat, duyuru ve talep verisi oluşturulacak. Devam edilsin mi?")) return;
    setSeeding(true);
    try {
      await seedDemoData();
      toast.success("Demo verisi oluşturuldu — Panel'e göz atabilirsin.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Demo verisi oluşturulamadı.");
    } finally {
      setSeeding(false);
    }
  }

  if (!isManager) return null;

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-ink">Ayarlar</h1>

      {status === "loading" && <p className="text-sm text-ink-faint">Yükleniyor…</p>}
      {status === "error" && <p className="text-sm text-red-600">Ayarlar alınamadı.</p>}

      {status !== "loading" && (
        <form onSubmit={handleSubmit} className="card space-y-4 p-5">
          <div>
            <label className="text-xs font-medium text-ink-faint">Site / bina adı</label>
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-blue-500"
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-medium text-ink-faint">Yönetici e-posta</label>
              <input
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                className="mt-1 w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-ink-faint">Yönetici telefon</label>
              <input
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                className="mt-1 w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-blue-500"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-ink-faint">Para birimi</label>
            <select
              value={currency ?? ""}
              onChange={(e) => setCurrency((e.target.value || null) as TenantSettings["currency"])}
              className="mt-1 w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-blue-500"
            >
              <option value="">Otomatik (dil ayarına göre)</option>
              <option value="TRY">TRY (₺)</option>
              <option value="EUR">EUR (€)</option>
              <option value="BGN">BGN (лв)</option>
            </select>
          </div>
          <label className="flex items-center gap-2 text-sm text-ink-soft">
            <input
              type="checkbox"
              checked={notifyEmail}
              onChange={(e) => setNotifyEmail(e.target.checked)}
              className="h-4 w-4 rounded border-line"
            />
            E-posta bildirimleri (yakında)
          </label>
          <button
            type="submit"
            disabled={submitting}
            className="btn min-h-[40px] bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {submitting ? "Kaydediliyor…" : "Kaydet"}
          </button>
        </form>
      )}

      <div className="card space-y-3 p-5">
        <h2 className="text-sm font-semibold text-ink">Demo verisi</h2>
        <p className="text-sm text-ink-faint">
          Ürünü hızlıca denemek için örnek bina, daire, aidat, duyuru ve talep verisi oluştur. Sadece kendi tenant'ına eklenir.
        </p>
        <button
          type="button"
          onClick={handleSeed}
          disabled={seeding}
          className="min-h-[40px] rounded-lg border border-line px-4 text-sm font-semibold text-ink-soft hover:border-blue-500 hover:text-blue-600 disabled:opacity-60"
        >
          {seeding ? "Oluşturuluyor…" : "Demo Verisi Yükle"}
        </button>
      </div>
    </div>
  );
}
