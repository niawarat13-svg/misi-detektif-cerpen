
> Paket ini sudah berisi konfigurasi Supabase untuk project yang dipakai pada deployment pengguna. Jangan membagikan Secret/Service Role Key.
# Misi Detektif Unsur Intrinsik Cerpen — Cloud Setup

Versi ini disiapkan untuk penggunaan lintas perangkat dengan:
- Supabase database + Auth
- Mode Guru: email/password
- Mode Siswa: anonymous sign-in + kode kelas
- RLS untuk membatasi akses data
- Vercel untuk hosting statis

## A. Siapkan Supabase
1. Buat project baru di Supabase.
2. Buka SQL Editor.
3. Jalankan seluruh isi `supabase-schema.sql`.
4. Buka Authentication > Sign In / Providers dan aktifkan **Anonymous Sign-Ins**.
5. Untuk guru, Email/Password aktifkan. Saat pengujian, guru dapat mendaftar dengan email dan password lalu mengikuti verifikasi email bila diminta.
6. Buka Settings > API Keys. Salin **Project URL** dan **Publishable key**.
7. Isi `config.js`:
   SUPABASE_URL: "https://....supabase.co"
   SUPABASE_PUBLISHABLE_KEY: "sb_publishable_..."
   DEMO_MODE: false

Supabase menyatakan publishable key memang dapat digunakan di client/browser, sedangkan RLS harus melindungi tabel. Jangan pernah memasukkan secret/service_role key ke frontend.

## B. Uji lokal
Buka `index.html` melalui web server lokal atau deploy langsung. Jangan membuka file HTML dengan file:// jika browser memblokir modul/network tertentu.

## C. Hosting Vercel
Cara paling sederhana pada 2026: gunakan Vercel Drop.
1. Login ke Vercel.
2. Buka vercel.com/drop.
3. Drag folder project ini ke halaman Drop.
4. Deploy.
5. Vercel memberikan URL publik.

Alternatif: push project ke GitHub lalu import repository ke Vercel.

## D. Uji lintas perangkat
Guru:
- buka URL
- Mode Guru
- daftar/login
- Buat Kelas
- bagikan Kode Kelas

Siswa:
- buka URL
- Mode Siswa
- masukkan Kode Kelas
- nama/kelompok
- kerjakan Misi 1–7

Guru kemudian refresh Dashboard dan akan melihat peserta, progress, jawaban, produk digital, dan refleksi.

## E. Catatan penting
Anonymous users tidak dapat memulihkan identitas mereka setelah sign out, menghapus data browser, atau berpindah perangkat. Untuk sesi kelas, minta siswa tetap menggunakan perangkat yang sama sepanjang kegiatan atau gunakan akun siswa permanen di versi lanjutan.

## Fitur Kelola Materi
Versi ini menambahkan tabel `materials` dan menu **📚 Materi Pembelajaran** pada halaman Kelola Kelas guru.
Guru dapat menambah, mengedit, menghapus, mengatur urutan, dan mempublikasikan materi. Materi dapat berupa teks,
infografik, video, PDF/e-modul, atau tautan. Siswa hanya melihat materi yang berstatus terbit pada kelasnya.

Jalankan bagian **Materials / Kelola Materi** pada `supabase-schema.sql` jika database Anda sudah memakai schema lama.
