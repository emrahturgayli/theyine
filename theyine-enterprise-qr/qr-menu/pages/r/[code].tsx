// QR landing — müşterinin QR'ı okutunca gördüğü sayfa. Açık tema, büyük font,
// tek belirgin CTA; mobil öncelikli. SSR'da kampanya bulunur ve qr_view
// server-side kaydedilir; CTA tıklaması client'tan qr_click olarak izlenir.
//
// Embed modu: ?embed=true (embed.js widget'ı) veya ?embed=1 ile açıldığında
// sayfa bir merchant sitesindeki iframe içindedir — dış linkler _blank açılır.
// ?theme=dark ile koyu tema uygulanır (embed.js data-theme attribute'undan gelir).

import Head from "next/head";
import type { GetServerSideProps } from "next";
import { getCampaignByCode, getMerchant, trackEvent } from "../../lib/db";
import { translate } from "../../lib/i18n";
import type { CampaignType } from "../../lib/types";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

interface Props {
  status: "ok" | "not_found" | "expired";
  code: string;
  dark: boolean;
  title?: string;
  description?: string;
  type?: CampaignType;
  targetUrl?: string;
  restaurantName?: string;
}

export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
  const code = String(ctx.params?.code || "");
  // Tema SSR'da okunur ki koyu tema ilk boyamada uygulansın (light→dark flash olmasın)
  const dark = ctx.query.theme === "dark";
  // İçerik dili: ?lang=bg|en|tr > sayfa locale'i > bg. Kampanyada titleI18n
  // yoksa base title/description kullanılır — mevcut kampanyalar etkilenmez.
  const LANGS = ["bg", "en", "tr"] as const;
  const qLang = String(ctx.query.lang || "");
  const lang = (LANGS as readonly string[]).includes(qLang)
    ? (qLang as (typeof LANGS)[number])
    : ctx.locale === "en"
      ? "en"
      : "bg";
  const campaign = getCampaignByCode(code);

  if (!campaign || !campaign.active) {
    ctx.res.statusCode = 404;
    return { props: { status: "not_found", code, dark } };
  }
  if (campaign.expiresAt && Date.parse(campaign.expiresAt) < Date.now()) {
    return { props: { status: "expired", code, dark } };
  }

  // Sayfa render'ı = 1 tarama (qr_view)
  trackEvent(campaign.id, campaign.merchantId, "qr_view", {
    ua: String(ctx.req.headers["user-agent"] || "").slice(0, 120),
  });

  const merchant = getMerchant(campaign.merchantId);
  return {
    props: {
      status: "ok",
      code,
      dark,
      title: campaign.titleI18n?.[lang] ?? campaign.title,
      description: campaign.descriptionI18n?.[lang] ?? campaign.description,
      type: campaign.type,
      targetUrl: campaign.targetUrl || "",
      restaurantName: merchant?.restaurantName || "",
    },
  };
};

const CTA_KEY: Record<CampaignType, string> = {
  menu: "qr.openMenu",
  reservation: "qr.bookTable",
  order: "qr.orderNow",
};

export default function QRLandingPage(props: Props) {
  const router = useRouter();
  const { locale } = router;
  const t = (k: string) => translate(locale, k);
  const [isEmbed, setIsEmbed] = useState(false);

  useEffect(() => {
    const embed = router.query.embed;
    setIsEmbed(embed === "true" || embed === "1");
  }, [router.query.embed]);

  const landingClass = `qr-landing${props.dark ? " theme-dark" : ""}`;

  if (props.status !== "ok") {
    return (
      <div className={`${landingClass} error-state`}>
        <h1>
          {props.status === "expired" ? t("qr.expired") : t("qr.notFound")}
        </h1>
        <div className="powered">
          {t("qr.poweredBy")} <b>THEYINE</b>
        </div>
      </div>
    );
  }

  // Non-blocking analytics — navigasyonu geciktirmez. API `{ code, event }`
  // sözleşmesini kullanır (bkz. pages/api/analytics/track.ts).
  const track = (event: "qr_click" | "qr_conversion") =>
    fetch("/api/analytics/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: props.code, event }),
      keepalive: true,
    }).catch(() => {});

  const handleClick = () => {
    track("qr_click");
    if (props.targetUrl) {
      // Dış hedefe giden tıklama = dönüşüm
      track("qr_conversion");
      if (isEmbed) {
        // Iframe içindeyiz — hedefi yeni sekmede aç, widget'ı bozma
        window.open(props.targetUrl, "_blank", "noopener,noreferrer");
      } else {
        window.location.href = props.targetUrl;
      }
    } else {
      // targetUrl yok → iç menü modalı (şimdilik placeholder)
      alert(t("qr.internalMenu"));
    }
  };

  return (
    <>
      <Head>
        <title>{`${props.title} — ${props.restaurantName}`}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="robots" content="noindex" />
      </Head>
      <div className={landingClass}>
        <div className="restaurant">{props.restaurantName}</div>
        <h1>{props.title}</h1>
        {props.description && <p className="desc">{props.description}</p>}
        <button className="cta" onClick={handleClick}>
          {t(CTA_KEY[props.type || "menu"])} →
        </button>
        <div className="powered">
          {t("qr.poweredBy")} <b>THEYINE</b>
        </div>
      </div>
    </>
  );
}
