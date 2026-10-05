# Birthday Link Studio 2.0

Aplikasi web/PWA untuk membuat kartu ulang tahun digital dan membagikannya melalui link. Tidak memerlukan database: isi kartu disimpan pada bagian `#card=` di URL.

## Fitur 2.0
- Editor nama penerima, pengirim, tanggal ulang tahun, judul, dan pesan.
- Upload foto penerima dengan kompresi otomatis di browser.
- 8 tema, 8 ikon, 3 gaya huruf.
- 5 template ucapan cepat.
- Efek confetti, love, dan bintang.
- Pilihan musik Birthday Chime / Dreamy via Web Audio.
- Pembuka kartu berupa amplop, kotak hadiah, atau langsung terbuka.
- Preview real-time dan mode khusus penerima.
- Share ke WhatsApp, Web Share API, salin link, dan buka link.
- Unduh desain kartu sebagai PNG.
- Draft tersimpan otomatis di localStorage.
- PWA: dapat di-install di Android, iPhone (Add to Home Screen), dan desktop setelah di-host melalui HTTPS.
- Service worker untuk cache/offline dasar.

## File
- `index.html` — struktur aplikasi.
- `style.css` — seluruh desain dan responsif.
- `app.js` — editor, encode/decode link, foto, share, musik, efek, PNG, draft, PWA.
- `manifest.webmanifest` — konfigurasi aplikasi installable.
- `sw.js` — service worker/cache offline.
- `icons/` — ikon PWA.

## Menjalankan lokal
Jangan mengandalkan klik langsung `index.html` untuk menguji PWA. Jalankan server lokal:

```bash
cd birthday-card-app-v2
python3 -m http.server 8080
```

Lalu buka:

`http://localhost:8080`

Fungsi kartu/editor tetap bisa berjalan saat file dibuka langsung, tetapi service worker/PWA membutuhkan HTTP(S).

## Instalasi tercepat — GitHub Pages
1. Buat repository baru di GitHub, misalnya `birthday-link`.
2. Upload semua isi folder ini ke root repository: `index.html`, `style.css`, `app.js`, `manifest.webmanifest`, `sw.js`, dan folder `icons`.
3. Buka **Settings → Pages**.
4. Pada **Build and deployment**, pilih **Deploy from a branch**.
5. Pilih branch `main` dan folder `/ (root)`, lalu **Save**.
6. Setelah deployment selesai, buka URL Pages yang diberikan GitHub.
7. Buat kartu dan tekan **Buat Link Ucapan**. Link tersebut sekarang bisa dikirim ke penerima.

## Instalasi Netlify
1. Login ke Netlify.
2. Pilih **Add new site → Deploy manually**.
3. Drag-and-drop seluruh folder `birthday-card-app-v2` (atau ZIP yang sudah diekstrak).
4. Setelah URL HTTPS aktif, aplikasi langsung bisa digunakan dan di-install sebagai PWA.

## Hosting/cPanel
1. Masuk ke File Manager hosting.
2. Buka `public_html` atau document root domain/subdomain.
3. Upload seluruh file dan folder aplikasi.
4. Pastikan `index.html` berada langsung di document root.
5. Pastikan domain menggunakan HTTPS agar PWA/service worker berfungsi.

## Install ke HP
### Android / Chrome
Buka alamat aplikasi melalui Chrome. Jika tombol **Install** muncul di header, tekan tombol tersebut. Jika tidak, buka menu Chrome → **Install app** atau **Add to Home screen**.

### iPhone / Safari
Buka aplikasi di Safari → tombol **Share** → **Add to Home Screen** → **Add**. iOS tidak selalu menampilkan event install seperti Chrome, jadi ini adalah cara normal instalasinya.

## Catatan penting tentang link + foto
Foto dikompres lalu dimasukkan ke URL agar aplikasi tetap tanpa database. Akibatnya, link yang memakai foto akan jauh lebih panjang. Untuk link pendek dengan URL seperti `/kartu/citra`, dibutuhkan backend/database atau layanan short-link. Versi ini sengaja tetap serverless agar paling mudah dipasang.

## Privasi
Aplikasi ini tidak mengirim data kartu ke server aplikasi. Namun ketika Anda membagikan URL, seluruh data kartu yang tersimpan pada fragment/hash ikut dimiliki oleh siapa pun yang memperoleh link tersebut. Jangan masukkan informasi rahasia.
