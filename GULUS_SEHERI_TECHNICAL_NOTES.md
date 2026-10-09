# Gülüş Şəhəri: 10 əlavə imkan

Canlı səhifə: https://bizdebeledir.github.io/gulus-seheri.html

1. İnteraktiv şəhər: batareyaya yüngül SVG/CSS xəritə, əsl 3D mühərriki deyil.
2. Video Çempionlar Liqası: 8 real video, 4 ikili duel, həftəlik sabit siyahı və həqiqi anonim səsvermə.
3. Gülüş DJ: 6 əhvala görə 3 real video və oyun tövsiyəsi.
4. Gülüş Missiyaları: 10 nişan, gündəlik və son 7 gün üzrə bu brauzerin fəaliyyəti.
5. Gizli Qapılar: 4 tapmaca, paylaşılabilən sürpriz keçidi.
6. Ağıllı axtarış: Azərbaycan hərfləri, yazı səhvləri və mövzu uyğunluğu.
7. Tamaşaçı Seçir: 3 mövzu üzrə həftəlik real səsvermə və moderatorlu ideya təklifi.
8. Offline PWA: yerli oyun və əsas ekranlar; YouTube və canlı sorğular offline deyil.
9. Lokal ölçmə: bu brauzerin son 30 gün hadisələri; Google Analytics bütün auditoriya üçün ayrıca sahib girişini tələb edir. Termux-da city_report.py lokal SQLite hesabatıdır.
10. Google Video Discovery 2.0: 81 video səhifəsi üçün dəqiq breadcrumbs, qısa təsvirlər, sayt daxili mövzu linkləri, yeni sitemap.

Əsas fayllar: gulus-seheri.html, gulus-seheri.css, city-core.js, city-app.js,
city-modes-a.js, city-modes-b.js, city-metrics.js, city_week.py, city_seo.py,
offline.html, sw.js, update_videos.py, site_doctor.py, video/*.html.

Server faylları: ~/ELMAR_OS_MODULES/site_visitors_v1/visitor_server.py,
park_votes.py, city_report.py. Backend Termux+Cloudflare müvəqqəti tunelindədir.
Workers/D1 gələcəkdə daimi keçid üçün kodda hazırdır, amma Cloudflare hesabına
yerləşdirilməyib. Telefon sönəndə canlı sorğular dayana bilər.

Sınaqlar:
node tests/test_city_core.js
node tests/test_city_dom.js
node tests/test_city_metrics.js
node tests/test_city_offline.js
node tests/test_park_core.js
node tests/test_park_dom.js
node tests/test_park_worker.mjs
node tests/test_dna_core.js
node tests/test_dna_ui.js
python site_doctor.py

81 və 123 videolu saxta YouTube API yenilənməsi ayrıca test olunub.
Nəticələr qəti real Android vizual sınağını əvəz etmir.
Səsvermədə xam IP və UUID saxlanmır, açarlı hash var; botlara qarşı tam zəmanət yoxdur.
Google indekslənmə və viral yayılma zəmanətli deyil.

Ehtiyat nüsxə:
~/bizdebeledir_github_audit_20261009/next10_backup_20261009/before_next10.zip
SQLite nüsxələri eyni qovluqdadır.
GitHub Actions workflow hesabın OAuth workflow icazəsi olmadığı üçün dəyişdirilmir.
