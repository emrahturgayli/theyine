// Merchant login sayfası. Başarılı girişte JWT localStorage'a yazılır ve
// dashboard'a yönlendirilir. Demo erişim bilgisi formun altında gösterilir.

import { useRouter } from "next/router";
import { useState, type FormEvent } from "react";
import Layout from "../../components/Layout";
import { TOKEN_KEY } from "../../components/AdminLayout";
import { useToast } from "../../components/Toast";
import { useT } from "../../lib/i18n";

export default function LoginPage() {
  const t = useT();
  const router = useRouter();
  const toast = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        setError(t("login.error"));
        return;
      }
      const data = await res.json();
      localStorage.setItem(TOKEN_KEY, data.token);
      localStorage.setItem("theyine-qr-merchant", data.merchantId);
      localStorage.setItem("theyine-qr-restaurant", data.restaurantName);
      toast(`${data.restaurantName} ✓`, "success");
      router.push("/admin");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Layout title={`${t("login.title")} | THEYINE QR`}>
      <form className="login-box" onSubmit={submit}>
        <h1>{t("login.title")}</h1>
        <div className="form-field">
          <label htmlFor="email">{t("login.email")}</label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
        </div>
        <div className="form-field">
          <label htmlFor="password">{t("login.password")}</label>
          <input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
        </div>
        {error && <div className="form-error">{error}</div>}
        <button className="btn btn-primary" disabled={busy}>
          {t("login.submit")}
        </button>
        <div className="demo-hint">{t("login.demoHint")}</div>
      </form>
    </Layout>
  );
}
