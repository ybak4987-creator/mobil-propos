# Pro POS Mobil Web

Bu paket yalnızca Pro POS'un telefon/mobil tarafıdır. PC/Electron, masaüstü menüleri ve Windows lisans katmanı çıkarılmıştır.

## Vercel
1. Bu klasörü GitHub'a yükle.
2. Vercel'de repo'yu import et.
3. Build Command: `npm run build`
4. Output Directory: `dist`
5. Supabase değişkenlerini ekle:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

## Telefona uygulama gibi ekleme
- Android Chrome: siteyi aç → menü → Uygulamayı yükle / Ana ekrana ekle.
- iPhone Safari: siteyi aç → Paylaş → Ana Ekrana Ekle.

## Not
Mobil ekran canlı Supabase verisini kullanır. Barkod tarama için HTTPS ve kamera izni gerekir.
