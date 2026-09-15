# BlokMate — Yayın Öncesi Kontrol Listesi

Her yayından (deploy) önce bu listeyi baştan sona, gerçek tarayıcıda elle geçin. "Derlendi" yeterli değildir — göz gezdirin.

1. **Landing sayfasını aç, dil TR mi?** Sayfayı yeniden yükle, hiçbir şeye tıklamadan dilin kendiliğinden değişmediğini doğrula.
2. **Register formunu boş gönder.** Anlaşılır bir uyarı çıkmalı, sayfa çökmemeli, form verisi kaybolmamalı.
3. **Register formunu geçerli verilerle gönder.** Yükleniyor durumu görünmeli, kayıt sonrası dashboard'a yönlendirmeli.
4. **Login'e hatalı şifre gir.** Hata mesajı Türkçe ve anlaşılır olmalı (ham İngilizce Supabase metni değil).
5. **Dashboard'ı yeni (boş) bir hesapla aç.** Hiçbir kartta geliştirici notu, teknik terim (şema/tablo/RLS) veya İngilizce metin görünmemeli.
6. **Sol menüdeki tüm başlıkları oku.** Hepsi seçili dilde olmalı, tek başına yabancı dilde kalan öğe olmamalı.
7. **Bina/daire ekleme formunu boş gönder, sonra geçerli veriyle gönder.** İkisi de doğru sonuç vermeli, tablo anında güncellenmeli.
8. **Bir ödeme akışını (Stripe test kartıyla) uçtan uca dene.** Checkout'a yönlenmeli, webhook sonrası fatura "ödendi" olmalı.
9. **Telefon genişliğinde (gerçek cihaz veya DevTools ile, otomasyon aracına güvenme) ana ekranları gez.** Taşan/üst üste binen öğe olmamalı.
10. **Konsolu aç, kırmızı hata var mı bak.** Sayfa geçişlerinde JS hatası çıkmamalı.

> Not: Bu liste 2026-09-15 tarihli uçtan uca QA testinde bulunan gerçek sorunlardan (dil değişimi, geliştirici notu sızıntısı, çevrilmemiş menü, ham hata mesajı) türetildi. Yeni bir sorun bulunduğunda buraya madde eklemek yerine önce en az önemli maddeyi çıkarıp listeyi 10'da tutun.
