# Bizdə Belədir: Cloudflare Workers + D1

Status: Worker mənbə kodu və D1 miqrasiyası hazırlanıb, lakin hələ Cloudflare-ə YAYIMLANMAYIB. Səbəb: hazırkı Termux mühitində Workers və D1 üçün səlahiyyətli Cloudflare API/OAuth girişi təsdiqlənməyib. Yalnız mövcud tunnel tokeninə əsaslanaraq Worker yaradılmır.

## Qorunan mövcud sistem
GitHub Pages-in hazırkı visitor.js və visitor-config.json faylları mövcud Termux SQLite sayğacına bağlı qalır. Yeni Cloudflare layihəsini yerləşdirmədən köhnə sayğacı dayandırma.

## Gələcək səlahiyyətli keçid
1. Cloudflare hesabına rəsmi Wrangler girişi: npx wrangler login (istifadəçinin OAuth təsdiqi).
2. Bu qovluqda wrangler.example.toml faylını wrangler.toml kimi kopyala.
3. D1 yarat: npx wrangler d1 create bb-site-visitors.
4. Wrangler-in verdiyi real database_id dəyərini wrangler.toml faylındakı yerinə qoy.
5. Miqrasiyaları uzaq bazaya tətbiq et:
   npx wrangler d1 migrations apply bb-site-visitors --remote
6. Worker-in sirrini daxil et:
   npx wrangler secret put VISITOR_SALT
   Minimum 24 simvoldan ibarət təsadüfi salt olmalıdır; GitHub-a, loga və buferə yazılmamalıdır.
7. İşə sal: npx wrangler deploy
8. Alınan HTTPS URL /health, /v1/ping və /v1/stats yollarında test edildikdən sonra GitHub-un visitor-config.json faylında endpoint yenilənir.
9. Canlı test uğurlu olandan sonra köhnə Termux visitor sayğacı dayandırıla bilər; bundan əvvəl YOX.

## Məhdudiyyətlər
- D1 pulsuz planında gündəlik məlumat oxuma/yazma limitləri var. Sentyabr 2026-dan bu limitlər qüvvədədir və sorğu limiti aşılarsa müvəqqəti xəta alınır.
- Demo Worker brauzer identifikatorunun serverdə HMAC xülasəsini saxlayır, xam identifikatoru/IP-ni saxlamır.
- Origin başlığı yoxlaması anti-bot təhlükəsizliyi demək deyil. Yüksək trafikdə WAF və əlavə sürət limitləri lazımdır.
- Tarixçə köçürülməyəcəksə, yeni bazada sayğac sıfırdan başlayacaq. Əvvəlki ziyarətləri uydurmaq olmaz.
- HTML/JS dəyişdirmək üçün əlavə hosting xərci tələb olunmur, amma Cloudflare istifadə həcminə görə qaydalar dəyişə bilər.
- D1 bazasına 120 saniyədə bir aktiv ziyarətçidən yalnız bir dəfə yazmaq nəzərdə tutulub.

Rəsmi sənədlər:
https://developers.cloudflare.com/d1/wrangler-commands/
https://developers.cloudflare.com/d1/reference/faq/
https://developers.cloudflare.com/changelog/post/2026-09-01-d1-free-tier-limit-enforcement/

## İdeya qəbulu
- Yeni Worker /v1/idea ünvanı ilə anonim təklifləri D1 ideas cədvəlində pending statusunda saxlayır.
- Hər şəbəkə mənbəyi üçün 24 saat ərzində maksimum iki təklif qəbul edir; xam IP saxlamır.
- D1 ideas cədvəli ELMAR OS-a avtomatik ötürülmür; Cloudflare hesabına girişdən sonra moderasiya/export inteqrasiyası lazımdır.
- Hazırkı Termux serverində ayrıca idea_moderation.py operator skripti yaradılıb.
- Saytın visitor.js və ideas.js faylları gələcək bb-site-visitors.<subdomain>.workers.dev domeninə hazırdır.
