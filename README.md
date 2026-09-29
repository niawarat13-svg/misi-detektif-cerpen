# Misi Detektif Unsur Intrinsik Cerpen — Website Final Scaffold

Berbasis modul ajar: Game-Based Learning (GBL), website sebagai media utama, tujuh misi, pola jawaban UNSUR → BUKTI TEKS → ALASAN/INTERPRETASI, produk akhir infografik digital/presentasi digital, dan refleksi.

## Saat ini
- Prototype UI responsif untuk HP/laptop.
- Mode Siswa dan Mode Guru.
- Kode kelas (demo).
- Peta 7 misi.
- Misi 1–7 dengan jawaban/bukti/alasan.
- Hint, progress, poin, produk digital, refleksi.
- Dashboard guru untuk peserta, jawaban, produk, dan penilaian.
- Demo menyimpan data di Local Storage agar bisa diuji tanpa server.

## Agar benar-benar lintas perangkat
1. Buat project Supabase.
2. Jalankan `supabase-schema.sql` pada SQL Editor.
3. Siapkan autentikasi guru/siswa dan kebijakan Row Level Security (RLS).
4. Isi `config.js` dengan project URL dan publishable/anon key.
5. Ganti fungsi demo Local Storage pada `app.js` dengan query Supabase untuk classes, students, answers, products, reflections.
6. Deploy folder ini ke hosting.

## Penting
- Jangan masukkan `service_role` key ke frontend.
- Teks cerpen lengkap “Mengucap Syukur” perlu dimasukkan pada versi produksi sesuai sumber yang digunakan guru.

## 5. Naskah cerpen
Teks “Mengucap Syukur” karya Rara Julia yang diberikan guru telah dimasukkan ke `story.js` dan ditampilkan penuh pada halaman **Baca Cerpen**.
