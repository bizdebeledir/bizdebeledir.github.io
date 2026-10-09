# Bizdə Belədir · Yumor Studiyası, TOP-50 seçmə tətbiqi

Bu yenilənmə TOP-50 siyahısından mövcud arxitekturaya uyğun 10 istiqaməti seçir. Qalan 40 təklif avtomatik qurulmuş sayılmır.

## Yeni funksiyalar

1. 5×5 BINGO: 36 situasiyadan sabit 25; 5 tamamlanan xana bir BINGO xətti. 9:16 PNG yerli Canvas ilə hazırlanır.
2. Mem kartı: real video başlığı + ziyarətçinin yazdığı gülməli cümlə əsasında mətn posteridir. Kadr çıxarılmır.
3. Google mövzuları: /movzular.html və /movzu/ daxilində 12 fərqli statik mövzu məqaləsi, real videolar və əlaqəli keçidlər.
4. Ölçmə: Studio və video səhifələrində real klik, ixrac və paylaşım hadisələri. GA4 bütün auditoriya hesabatına yalnız ayrıca sahib girişi ilə baxılır.
5. Yumor ensiklopediyası: hər mövzuda müəllif tərəfindən hazırlanmış məişət izahları və iki oxucu sualı.
6. Video arxivi: ötən ilin eyni Bakı təqvim günündə video varsa həmin video, yoxdursa ən köhnə real videolardan nümunələr.
7. QR dəvətnamə: bir real video üçün lokal QR, Canvas-dan PNG.
8. 5-video paketi: 1–5 real video ID-si ilə paylaşılabilən URL; şəxsi hesab tələb olunmur.
9. Mini-serial kolleksiyası: 5 fərqli mövzuda real Shorts seçmələri, ayrıca serial çəkilişi deyil.
10. Link Doktor: bütün yeni mövzu səhifələrinin, sitemap və daxili linklərinin read-only yoxlanması.

## Texniki fayllar

studio-core.js, studio-app.js, studio-tools-a.js, studio-tools-b.js,
studio-topics.json, studio_build_pages.py, studio-topic-live.js,
studio_link_doctor.py, vendor-qrcode.js, yumor-studiyasi.html,
yumor-studiyasi.css, movzular.html, movzu/*.html.

QR kitabxanası: qrcode-generator v1.4.4, Kazuhiko Arase, 2009, MIT lisenziyası.
Kitabxana yerli saxlanır; QR linkini üçüncü tərəf API-yə göndərmir.

## Mövcud sistem və avtomatik sync

YouTube yenilənməsi altı saatdan bir davam edir. update_videos.py sitemap-ə 12 mövzu və iki studiya ünvanı əlavə edir. studio-topic-live.js HTML-dəki statik məqalələri saxlayır, yeni real videoları son video JSON faylından əlavə edir.

Mövcud 20 Yumor Parkı, 10 Gülüş Şəhəri və DNT oyunu qorunub.
Site Doctor bütün yeni link yoxlamalarını da işlədir.
Offline hazırla düyməsi mövcud PWA keşinə yeni statik studiya fayllarını da əlavə edə bilir.

## Test komandaları

node tests/test_studio_core.js
node tests/test_studio_dom.js
python studio_link_doctor.py
python site_doctor.py
python tests/test_studio_sync.py

81 və 123 videolu API simulyasiyaları, öncəki şəhər/park/DNT sınaqları da saxlanılır.

## Məhdudiyyətlər

Bu mərhələdə 50 funksiyanın hamısı deyil, seçilmiş 10 istiqamət həyata keçirilir.
Google indekslənməsi və viral yayılma zəmanətli deyil.
Real Android-də PNG saxlanması, cihazda bildirişlər və ekran görünüşü ayrıca yoxlanmalıdır.
Bütün sayt auditoriyasının GA4 hesabatı üçün hesab sahibi girişi lazımdır.
Telefonun bazalarına, şəxsi açarlara və server ayarlarına dəyişiklik edilmir.

GitHub Actions workflow dəyişməyib, çünki OAuth workflow icazəsi ayrıca tələb olunur.
Static topic pages manual refresh: python studio_build_pages.py.
Canlı JS yeni videoları mövzu siyahısına avtomatik əlavə edir.

İlkin ehtiyat arxiv:
~/bizdebeledir_github_audit_20261009/selected50_backup_20261009/local_before_selected50.zip.
