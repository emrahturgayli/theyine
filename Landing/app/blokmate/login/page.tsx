"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useBlokmateAuth } from "@/lib/blokmate-auth-context";

export default function BlokmateLoginPage() {
  const router = useRouter();
  const { signIn } = useBlokmateAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setError(null);
    const { error } = await signIn(email, password);
    if (error) {
      setStatus("error");
      setError(error);
      return;
    }
    router.push("/blokmate/dashboard");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-canvas px-4 py-16">
      <div className="card w-full max-w-sm p-8">
        <Link href="/blokmate" className="text-sm font-semibold text-blue-600">
          ← BlokMate
        </Link>
        <h1 className="mt-4 text-2xl font-bold text-ink">Giriş yap</h1>
        <p className="mt-1 text-sm text-ink-faint">Yönetici veya sakin hesabınla oturum aç.</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="email" className="text-sm font-medium text-ink">
              E-posta
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-ink outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label htmlFor="password" className="text-sm font-medium text-ink">
              Şifre
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-ink outline-none focus:border-blue-500"
            />
          </div>

          {status === "error" && (
            <p role="alert" className="text-sm text-red-600">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={status === "loading"}
            className="btn w-full min-h-[44px] bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {status === "loading" ? "Giriş yapılıyor…" : "Giriş yap"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-ink-faint">
          Hesabın yok mu?{" "}
          <Link href="/blokmate/register" className="font-semibold text-blue-600">
            Kayıt ol
          </Link>
        </p>
      </div>
    </main>
  );
}
