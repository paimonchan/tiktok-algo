# TikTok Growth Lab

Ruang kerja publik untuk **menaikkan akun TikTok `@elite.paimonchan`** (animasi AI karakter manhwa/webtoon).
Isinya tiga hal yang saling terkait: **riset algoritma TikTok yang bisa diverifikasi**, **review akun berbasis angka**,
dan **log progres bertahap**.

Live: https://paimonchan.github.io/tiktok-algo/

## Halaman

| Halaman | Isi |
|---|---|
| `index.html` | **Status**: misi, temuan utama, target terukur, rencana 3 fase, progres terakhir |
| `mudah.html` | **Mulai cepat (5 menit)**: cara kerja algoritmanya dalam bahasa manusia + langkah praktis |
| `audit.html` | **Review akun**: angka 12 video terakhir, like rate, dua mode kegagalan (reach vs resonansi), prioritas tindakan |
| `progress.html` | **Progress**: log bertahap — tanggal, angka akun, aksi, hasil, keputusan |
| `playbook.html` | **Playbook**: taktik per taktik dengan alasan mekanisme, tingkat bukti, dan cara mengukur |
| `bedah.html` | **Riset & bukti**: arsitektur funnel, fungsi objektif, infra ByteDance, gerbang kelayakan, tabel mitos vs fakta |
| `sumber.html` | **Sumber**: 50 rujukan dengan label tingkat bukti T1–T5 |
| `riset-lengkap.md` | Riset lengkap dalam satu berkas markdown |

## Data (satu sumber kebenaran)

Angka di situs tidak ditulis di HTML, tapi dibaca aplikasi dari berkas JSON supaya bisa diperbarui tanpa menyentuh tampilan:

```
data/status.json     # snapshot akun, target, fase rencana
data/audit.json      # video per video + pola + eksperimen terjadwal
data/progress.json   # entri log bertahap
assets/growth.js     # merender ketiga berkas di atas ke halaman
```

### Alur update (dikirim lewat Telegram)

1. Pemilik akun mengirim update ke Telegram (mis. `follower 4.612, 3 video baru: 320 / 145 / 89 views`).
2. Agen menambahkan entri baru ke `data/progress.json` (dan menyegarkan `data/audit.json` / `data/status.json` bila angkanya berubah).
3. `git push` → GitHub Pages menerbitkan versi baru. Tidak perlu build, tidak perlu deploy manual.

Bump `?v=N` pada `assets/*` di setiap HTML kalau CSS/JS berubah (CDN GitHub Pages meng-cache ±10 menit).

## Tingkat bukti

| Tier | Sumber | Bobot |
|---|---|---|
| T1 | Dokumen resmi TikTok/Douyin, regulator (Komisi Eropa), putusan pengadilan | Fakta, tapi bisa normatif |
| T2 | Dokumen internal bocor yang keasliannya dikonfirmasi (TikTok Algo 101, gugatan Kentucky, manual sensor Douyin) | Fakta kuat soal desain & tujuan internal |
| T3 | Paper engineering ByteDance (Monolith, Deep Retrieval, Interest Clock, HLLM, LONGER, Trinity, X-Rec) | Fakta komponen & hasil A/B — bukan spesifikasi penuh For You |
| T4 | Studi audit independen (sock puppet/bot) | Mengukur perilaku, bukan mekanisme |
| T5 | Folklore operator, blog "system design", riset sekuritas, self-media | Hipotesis; angkanya hampir selalu tanpa sumber |

## Yang sengaja tidak ada di sini

Angka-angka populer tanpa rujukan — "ranker 500M parameter", "200+ fitur", "1.000 kandidat",
"kolam 200–500 viewer dengan ambang completion 45%", "73k QPS". Tidak satu pun berasal dari ByteDance
atau dokumen resmi, dan situs ini menjelaskan kenapa klaim seperti itu tidak layak dijadikan dasar strategi.

Begitu juga klaim pertumbuhan: tidak ada resep beli view, follow-tukar-follow, atau trik tag.

## Struktur teknis

- Tanpa framework, tanpa build step, tanpa CDN. HTML + satu CSS + dua JS kecil (toggle tema, renderer data).
- Mobile-first: tabel jadi daftar berlabel di layar sempit (`table.stack` + `data-label`); diukur, bukan dikira-kira — 0 px overflow di 390 px.
- Tema terang/gelap otomatis mengikuti sistem, bisa dioverride manual (`localStorage`).
- Aksesibilitas: skip link, kontras memadai, penanda tier memakai teks (bukan hanya warna), navigasi keyboard, `aria-current` di nav.

```
.
├── index.html  audit.html  progress.html
├── mudah.html  playbook.html  bedah.html  sumber.html
├── riset-lengkap.md
├── data/
│   ├── status.json  audit.json  progress.json
└── assets/
    ├── style.css  app.js  growth.js  favicon.svg
```

## Menjalankan lokal

```bash
python3 -m http.server 8080   # perlu server (bukan file://) karena data/*.json di-fetch
# buka http://localhost:8080
```

## Lisensi & atribusi

Riset & penulisan mandiri, tidak berafiliasi dengan TikTok atau ByteDance. Kutipan pihak ketiga tetap milik
pemiliknya; setiap klaim punya tautan di `sumber.html`. Data akun diambil dari endpoint publik TikTok.
