# Pro POS Mobil — GitHub Pages

Bu repo yalnızca mobil web/PWA sürümüdür.

## GitHub'a yükleme

1. GitHub'da yeni bir repo oluştur.
2. Bu ZIP'in içindeki **dosyaların tamamını** repo köküne yükle.
3. Branch adı `main` olsun.
4. GitHub'da **Settings → Pages → Source** bölümünde **GitHub Actions** seç.
5. Sonra **Actions** sekmesine gir. `Deploy Pro POS Mobile to GitHub Pages` çalışıp yeşil olduğunda Pages adresin oluşur.
6. Actions çalışmazsa Settings → Actions → General kısmında Actions izinlerinin açık olduğundan emin ol.

Önemli: `.github/workflows/deploy.yml` dosyasını silme. GitHub Pages için otomatik build/deploy işlemini o yapıyor.

## Supabase

`src/lib/supabase.ts` içinde proje URL/key zaten tanımlıysa ayrıca `.env` gerekmez. Güvenlik için yalnızca Supabase'in publishable/anon anahtarını kullan; service-role key'i tarayıcıya koyma.

## Telefona uygulama olarak ekleme

Pages adresini telefonda aç:
- Android Chrome → menü → Uygulamayı yükle / Ana ekrana ekle
- iPhone Safari → Paylaş → Ana Ekrana Ekle

## Yerel test

`npm install`
`npm run dev`
