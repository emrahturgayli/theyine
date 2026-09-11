# BlokMate - Proje Şartnamesi (SPEC.md)

## 1. Uygulamanın Tek İşi ve Amacı
BlokMate; site, apartman ve plaza yöneticileri için geliştirilmiş, "Apsiyon" gibi hantal sistemlere alternatif, **ultra-basit, modern ve mobil uyumlu bir aidat & sakin yönetim SaaS platformudur.**
**Temel Felsefe:** Yöneticinin hayatını kolaylaştır, sakine şeffaflık sağla. Karmaşık muhasebe terimlerinden kaçın.

## 2. Hedef Kitle
* **Yöneticiler (Managers):** Kendi sitelerini sisteme ekleyen, daireleri oluşturan, aidat borçlandıran ve ödemeleri takip eden kişiler.
* **Sakinler (Residents):** Davet koduyla sisteme giren, borcunu gören ve ödeyen kişiler (Mülk Sahibi veya Kiracı olabilirler).

## 3. Kapsam Dışı (Neyi YAPMAYACAĞIZ?)
* Restoran QR menüsü veya lojistik otomasyonları YAPILMAYACAK.
* Karmaşık çift taraflı muhasebe (Bilanço, mizan vb.) YAPILMAYACAK (Basit gelir/gider ve borç/alacak mantığı kullanılacak).

## 4. Veri Modeli ve Hiyerarşi (Supabase)
* **Tenants (Çalışma Alanı):** Yöneticinin hesabı (Tüm veriler Tenant_ID ile izole edilir).
* **Buildings (Binalar/Siteler):** Tenant'a bağlı yapılar.
* **Units (Daireler/Bölümler):** Binalara bağlı bağımsız bölümler.
* **Profiles/Users (Kullanıcılar):**
  * `role = 'manager'` (Yönetici)
  * `role = 'resident'` (Sakin) -> Alt statüler: `Kiracı` (Tenant) veya `Mülk Sahibi` (Owner).
* **Dues/Invoices (Aidatlar):** Dairelere kesilen borç tahakkukları.

## 5. Mevcut Durum (Tamamlananlar)
* Manager kayıt, Tenant oluşturma ve "Empty State" ekranları yapıldı.
* Sakinler için Davet Kodu (Invite Code) üretim ve doğrulama akışı yapıldı.
* Bekleyen sakinler için State Detection (Durum Algılama) onay akışları tamamlandı.

## 6. Sıradaki Sprint (Ömer/Beta Feedback Entegrasyonu)
Bu özellikler bir sonraki kodlamada sisteme eklenecektir:
1. **Kullanıcı Kaydı Güncellemesi:** Kayıt formuna ve veritabanı profiline "Telefon Numarası" alanı eklenecek.
2. **Sakin Statüsü:** Sakin daireye bağlanırken/kaydolurken statüsünü seçecek: `Mülk Sahibi` veya `Kiracı`.
3. **Otomatik Aidat Atama (Bulk Insert):** Bina ayarlarına "Standart Aidat Tutarı" girilecek. Yönetici tek bir butona basarak ("Aylık Aidatları Tahakkuk Et"), o binadaki tüm dolu dairelere o tutar kadar otomatik borç/fatura oluşturacak.