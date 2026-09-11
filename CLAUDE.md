# BlokMate - Claude Code Kuralları ve Proje Hafızası

## 1. Kurallar (İletişim ve Davranış)
- Her zaman Türkçe cevap ver.
- Yanıtları ve açıklamaları sade, öz ve net tut.
- Bir kod değişikliği veya işlem yapmadan önce kısaca ne yapacağını söyle.
- Değişiklik sonrasında `tsc --noEmit` ve `next build` ile kontrol sağla.

## 2. Bağlam (Context)
- **Proje:** BlokMate — Apsiyon alternatifi, ultra basit, mobil uyumlu site/apartman yönetim SaaS platformu.
- **Teknoloji:** Next.js (App Router), Supabase (PostgreSQL, RLS, Auth), Tailwind CSS, Vercel.
- **Canlı Adres:** https://www.theyine.com/blokmate
- **Anayasa:** Proje gereksinimleri `SPEC.md` dosyasında tanımlıdır.

## 3. Dosya Haritası
- `SPEC.md`: Projenin ana gereksinimleri ve mimari anayasası.
- `supabase/migrations/`: Veritabanı şema ve SQL güncellemeleri (Son çalışan: 015 & 016).
- `lib/blokmate-data.ts`: Supabase istemcisi ve RLS destekli veri erişim katmanı.
- `app/blokmate/`: Frontend sayfaları (Invites, Dues, Units, Buildings).
- `components/blokmate/`: Tekrar kullanılabilir UI bileşenleri (ResidentStatusPicker, MarkPaidButton vb.).