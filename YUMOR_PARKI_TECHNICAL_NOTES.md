# Bizdə Belədir · Yumor Parkı

20 oyun, bir sayt. Giriş: /yumor-parki.html

## Quraşdırılmış oyunlar

1. Yumor DNT: mövcud laboratoriyaya keçid.
2. Gülüş Dueli: üç sual və paylaşılabilən, qısa kodlu dost müqayisəsi.
3. Şəxsi mini-komediya: üç real video; yalnız toxunduqda oynatma.
4. Paralel Həyatlar: üç seçimdən yaranan xəyali səhnə və real video.
5. Azərbaycan Evinin Pultu: müxtəlif mövzulu video kanalları.
6. Yumor Detektivi: real başlıqlar əsasında üç tapmaca.
7. Komediya TV: retro TV və real YouTube video oynadıcısı.
8. Hansı obrazsan?: əyləncəli rol və uyğun video seçimi.
9. Sonluğu tap: başlıqdakı gizlənmiş iki sözü tapmaq.
10. Gündəlik Gülüş Qutusu: Bakı tarixindən seçilən gündəlik sürpriz.
11. Situasiya Atlası: bölgə adları ilə xəyali məişət səhnələri; real coğrafi statistika deyil.
12. Səsli Tapmaca: brauzerin yerli səsləndirməsi və mətn ehtiyat variantı.
13. Reaksiya Oyunu: brauzerdə reaksiya müddəti və şəxsi rekord.
14. Öz Hekayəni Qur: üç seçimdən yerli mini-sənari.
15. Gizli Xəzinə: 04, 07, 10, 14, 20 nömrəli kartlardan beş nişan toplanır.
16. Yumor Pasportu: DNT testində PNG şəkil yaradılması.
17. Sabah nə olacaq?: tamamilə əyləncəli, uydurma gündəlik yumor proqnozu.
18. Hamı Belə Edir?: SQLite-dakı real anonim səsvermə nəticələri.
19. Sən Rejissorsan: seçimlərdən situasiya qurmaq və moderasiyaya göndərmək.
20. Yumor Zənciri: mövzuya yaxın videolar arasında gəzinti; bütün bazanı bitirəndə təkrar.

## Sistem

- Statik səhifə: yumor-parki.html, yumor-parki.css
- Oyun məlumatları: park-engine.js
- Ortaq idarəetmə: park-app.js
- Oyunlar: park-games-a.js və park-games-b.js
- Real YouTube siyahısı: all-videos.json (mövcud sinxronizasiya)
- Anonim sorğu API-si: GET /v1/polls, POST /v1/vote
- Rejissor təklifləri: POST /v1/idea, təsdiqsiz heç nə avtomatik dərc edilmir
- Şəxsi brauzer yaddaşı: rekord, cavablar, videolar və gizli nişanlar
- Hazırkı backend Termux-da işləyir; müvəqqəti Cloudflare tunelindən asılıdır
- Cloudflare Workers + D1 kodu gələcək daimi yerləşdirməyə hazırlanıb, lakin yerləşdirilməyib

## Testlər

- node tests/test_park_core.js
- node tests/test_park_dom.js
- node tests/test_park_worker.mjs
- node tests/test_dna_core.js
- node tests/test_dna_ui.js
- python site_doctor.py

Site Health işinin YAML faylı Termux-da hazırlanıb, lakin GitHub OAuth workflow icazəsi olmadığından repoya göndərilmir. Mövcud YouTube sinxronizasiyası hər 6 saatdan bir Site Doctor yoxlamasını işlədir.
81 və 123 videolu saxta API ilə sınaqlarda bütün park faylları saxlanılıb.

## Təhlükəsizlik və məhdudiyyətlər

Səslər yalnız qəbul edilmiş real sorğulardan sayılır. Xam IP və brauzer ID-si səs
bazasına yazılmır; yalnız açarlı hash saxlanılır. Bu sadə qoruma botlardan tam
mühafizə etmir. Server əlçatmaz olanda saytda saxta səs və trend rəqəmləri
göstərilmir. Region səhnələri və gələcək proqnozları real məlumat deyil.

Videolar avtomatik oynadılmır; browserin audio oxuma imkanı olmazsa mətn göstərilir.
Telefon sönəndə canlı sorğular dayana bilər. D1 keçidi üçün ayrıca Cloudflare
hesab icazəsi tələb olunur. Brauzer simulyasiya sınaqları real Android ekran testini
əvəz etmir. Heç bir saxlanılmış hesab açarı repoya daxil edilməyib.
