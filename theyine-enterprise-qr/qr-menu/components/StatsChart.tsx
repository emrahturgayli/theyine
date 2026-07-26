// Son 7 günün tarama sayılarını gösteren bağımlılıksız bar chart.
// data: [6 gün önce, ..., bugün] — /api/qr/list'in `last7` alanından beslenir.

import { useRouter } from "next/router";

export default function StatsChart({ data }: { data: number[] }) {
  const { locale } = useRouter();
  const max = Math.max(...data, 1);
  const today = new Date();

  return (
    <div className="chart-bars">
      {data.map((value, i) => {
        const d = new Date(today);
        d.setDate(d.getDate() - (6 - i));
        const day = d.toLocaleDateString(locale === "en" ? "en-GB" : "bg-BG", {
          weekday: "short",
        });
        return (
          <div className="chart-col" key={i}>
            <span className="num">{value}</span>
            <div
              className="bar"
              style={{ height: `${Math.round((value / max) * 100)}%` }}
            />
            <span className="day">{day}</span>
          </div>
        );
      })}
    </div>
  );
}
