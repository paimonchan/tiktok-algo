# Bedah Algoritma TikTok

Situs statis (zero-build) berisi bedah algoritma TikTok berbasis **sumber primer**, plus playbook yang bisa dieksekusi untuk membuat video rame dan follower tumbuh.

Live: https://paimonchan.github.io/tiktok-algo/

## Isi

| Halaman | Isi |
|---|---|
| `index.html` | Ringkasan 3 menit: bentuk sistemnya, kesimpulan inti, peta situs |
| `bedah.html` | Bedah teknis + bukti: arsitektur funnel, objektif, infrastruktur, gerbang kelayakan, konteks 2024–2026, tabel mitos vs fakta |
| `playbook.html` | Taktik yang diturunkan dari mekanisme yang terbukti, plus protokol eksperimen untuk mengujinya di akun sendiri |
| `sumber.html` | 50 rujukan dengan label tingkat bukti T1–T5 |
| `riset-lengkap.md` | Riset lengkap dalam satu berkas markdown |

## Tingkat bukti

| Tier | Sumber | Bobot |
|---|---|---|
| T1 | Dokumen resmi TikTok/Douyin, regulator (Komisi Eropa), putusan pengadilan | Fakta, tapi bisa normatif |
| T2 | Dokumen internal bocor dengan keaslian dikonfirmasi (TikTok Algo 101, gugatan Kentucky, manual sensor Douyin) | Fakta kuat soal desain & tujuan internal |
| T3 | Paper engineering ByteDance (Monolith, Deep Retrieval, Interest Clock, HLLM, LONGER, Trinity, X-Rec) | Fakta komponen & hasil A/B — bukan spesifikasi penuh For You |
| T4 | Studi audit independen (sock puppet/bot) | Mengukur perilaku, bukan mekanisme |
| T5 | Folklore operator, blog "system design", riset sekuritas, self-media | Hipotesis; angkanya hampir selalu tanpa sumber |

## Yang sengaja tidak ada di sini

Angka-angka populer tanpa rujukan — "ranker 500M parameter", "200+ fitur", "1.000 kandidat", "kolam 200–500 viewer dengan ambang completion 45%", "73k QPS". Semuanya tidak berasal dari ByteDance atau dokumen resmi mana pun, dan situs ini menjelaskan kenapa klaim seperti itu sebaiknya tidak dipakai sebagai dasar strategi.

## Struktur teknis

- Tanpa framework, tanpa build step, tanpa CDN. Hanya HTML + satu berkas CSS + satu berkas JS kecil (toggle tema).
- Mobile-first: tabel berubah menjadi daftar berlabel di layar sempit (`table.stack` + `data-label`).
- Tema terang/gelap otomatis mengikuti sistem, bisa dioverride manual (disimpan di `localStorage`).
- Aksesibilitas: skip link, kontras memadai, penanda tier memakai teks (bukan hanya warna), navigasi keyboard.

```
.
├── index.html
├── bedah.html
├── playbook.html
├── sumber.html
├── riset-lengkap.md
└── assets/
    ├── style.css
    └── app.js
```

## Menjalankan lokal

```bash
python3 -m http.server 8080
# buka http://localhost:8080
```

## Lisensi & atribusi

Tulisan: riset mandiri, tidak berafiliasi dengan TikTok atau ByteDance. Kutipan dari sumber pihak ketiga tetap milik pemiliknya masing-masing; setiap klaim di situs punya tautan ke sumbernya di `sumber.html`.
