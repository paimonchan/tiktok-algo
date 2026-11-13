# Bedah Algoritma TikTok — apa yang benar-benar terverifikasi

Disusun 13 Nov 2026. Metode: dokumen resmi platform, putusan pengadilan, dokumen internal bocor (yang keasliannya dikonfirmasi), paper engineering ByteDance, studi audit akademik, diskusi HN. Setiap klaim diberi label bukti.

## 0. Tingkat bukti (dipakai di seluruh dokumen)

| Tier | Sumber | Bobot |
|---|---|---|
| T1 | Dokumen resmi TikTok/Douyin, regulator (EC), putusan pengadilan | Fakta; tapi bisa normatif (apa yang *diklaim* berjalan) |
| T2 | Dokumen internal bocor dengan keaslian dikonfirmasi (TikTok Algo 101, dokumen gugatan Kentucky, manual sensor Douyin) | Fakta kuat tentang desain & tujuan internal |
| T3 | Paper ByteDance (Monolith, Deep Retrieval, Interest Clock, HLLM, LONGER, Trinity, X-Rec) | Fakta soal komponen & deployment (A/B online), tapi bukan spesifikasi penuh FYP |
| T4 | Studi audit eksternal (sock puppet/bot) | Mengukur *perilaku* sistem, bukan mekanismenya |
| T5 | Folklore operator, blog "system design", riset sekuritas, self-media Tiongkok | Hipotesis; angkanya hampir selalu tanpa sumber |

## 1. Arsitektur inti (T1+T2+T3)

Funnel, bukan satu model. TikTok sendiri menyebut 5 tahap: **selecting videos → prediction → ranking → similarity check (diversity) → recommendation rules** [1]. Douyin menyebut **召回 (recall) → 过滤 → 排序** [2]. Pengadilan D.C. Circuit mendeskripsikan hal yang sama sebagai temuan faktual: engine "identifies a pool of candidate videos for a user, then scores and ranks those videos using machine-learning models" [3].

- **Recall/kandidat**: dua-tower model (resmi Douyin) [2][4], plus Deep Retrieval (retrieval berbasis path diskret + beam search, paper ByteDance) [5]. Trinity = retriever multi-interest/long-tail/long-term yang "deployed on the recommender system of Douyin" [6].
- **Ranking**: Wide&Deep sebagai model utama (resmi Douyin) [4][7]; skor akhir = kombinasi berbobot banyak prediksi (multi-objective / MMoE-style).
- **Rerank/打散**: diversity injection, penggantian video yang mirip, "tidak menampilkan dua video berturut-turut dengan sound/kreator sama" [1][8].
- **Inference & real-time**: Monolith — embedding table *collisionless* (Cuckoo hashing), training online dari stream (Kafka + Flink joiner), parameter server sync ke serving tiap interval menit → ini yang bikin feed reaktif dalam hitungan menit, bukan jam. Paper menyebut deployment di BytePlus Recommend; pemakaian di TikTok sendiri = inferensi wajar, bukan pernyataan paper [9][10].
- **Generasi model terbaru (2024–2026)**: HLLM (LLM untuk item/user modeling) [11], LONGER (long-sequence transformer, "fully deployed at more than 10 influential scenarios at ByteDance, serving billion users") [12], Interest Clock & Long-Term Interest Clock (jam-dalam-hari sebagai fitur; "deployed on Douyin Music App") [13][14], dan X-Rec (2026) — retrieval generatif pakai flow matching, "deployed as a new retrieval source for a specific vertical content on TikTok", +4.1484% vertical engagement [15]. Arah jelas: ranker makin besar, retrieval bergeser dari ANN murni ke generatif.

## 2. Fungsi objektif — apa yang sebenarnya dimaksimalkan

- **T2, paling penting**: dokumen internal "TikTok Algo 101" (tim engineering Beijing; keaslian dikonfirmasi jubir TikTok). Empat tujuan: **用户价值 (user value), 用户价值-长期 (long-term user value), 作者价值 (creator value), 平台价值 (platform value)**. "Ultimate goal: menambah DAU"; dua metrik yang dioptimasi: **"retention"** (user balik lagi) dan **"time spent"**. Persamaan kasar yang ditulis dokumen: `Plike×Vlike + Pcomment×Vcomment + Eplaytime×Vplaytime + Pplay×Vplay` — P = prediksi ML, V = nilai/nilai perilaku nyata. Dokumen juga menyebut penambahan nilai negatif seperti `same_author_seen` dan `same_tag_today` (bosan → user keluar = nilai total turun), penindasan "like bait", dan **"creator monetization" sebagai salah satu goal** [16].
- **T1**: Douyin (April 2025, open day) menyatakan **北极星指标 = 用户长期价值**, dengan target multi-objektif: 完播, komentar, like, konsumsi jangka panjang ke penulis, share, 跟拍, 收藏. Sekaligus: algoritma "hampir tidak bergantung pada pelabelan konten/user" — dia memprediksi perilaku, bukan membaca makna [4][7].
- **T1 (regulator)**: Komisi Eropa (5 Nov 2026) menyimpulkan sementara bahwa FYP TikTok melanggar DSA karena efek "rabbit hole", dan menyatakan **"the algorithm prioritises showing users content based on viewing time, over their choice to see less of certain content"** — jadi sinyal "Not interested" kalah bobot dibanding watch time [17].
- Sinergi: watch time/completion = sinyal dominan (WSJ bot study juga menyimpulkan hanya watch time yang benar-benar menentukan) [18].

## 3. Yang ternyata folklore (jangan diterima sebagai fakta)

Klaim populer: "video baru masuk kolam kecil 200–500 orang → kalau completion rate >45% naik ke kolam 1.000–5.000 → dst, 4–6 tingkat". **Tidak ada sumber primer** untuk angka, ukuran batch, maupun ambang batasnya [19][20].
- Istilah "traffic pool/cold start pool" muncul di (a) riset sekuritas Tiongkok (浙商证券) yang mendeskripsikan 1000 eksposur awal + threshold 10% — T5 [21]; (b) bocoran manual sensor Douyin 2022 (ABC News): konten sensitif yang naik trafik "enters a traffic pool and may be escalated through four levels of human checks" — di sini "traffic pool" = **eskalasi review manusia**, bukan kelas distribusi [22].
- Bentuk kualitatifnya tetap konsisten dan ada dukungan T1: TikTok menyatakan "content gets a second look when it gains popularity or when someone reports it", dan "makin tinggi trafik, makin sering & makin ketat dievaluasi" (Douyin) [23][24]. Jadi progresif-melebar itu nyata sebagai *review*, sedangkan angkanya karangan.
- Mitos lain: "algoritma pakai tag semantik" → dibantah resmi oleh Douyin [4]; "jumlah follower bukan faktor langsung" (pernyataan resmi TikTok 2020) [8].

## 4. Perilaku terukur (T3/T4)

- WSJ 2021: ~100 akun bot; TikTok bisa menyimpulkan minat dalam 40 menit–2 jam; rata-rata view video awal 6,31 juta → turun ke 0,78 juta saat masuk niche [18].
- CCDH (Des 2022): konten bunuh diri muncul dalam 2,6 menit di akun baru ber-username "loseweight"; akun "vulnerable" dapat 12x video self-harm (TikTok membantah metodologinya) [25].
- Amnesty + AI Forensics (Nov 2023): setelah 5–6 jam, hampir 1 dari 2 video terkait kesehatan mental, ~10x kontrol [26].
- arXiv 2503.20231: amplifikasi minat kuat terjadi **dalam ~200 video pertama**; makin kuat amplifikasi, makin turun eksplorasi (korelasi negatif dengan hashtag baru) [27].
- arXiv 2403.12410: exploitation = 30–50% dari 1000 video pertama; **like dan follow adalah pendorong personalisasi utama** [28].
- arXiv 2501.17831 (NYU Abu Dhabi): 323–381 sock puppet, ~394k video → akun yang di-seed konten Partai Republik menerima ~11,8% lebih banyak konten sepaham; didorong konten *negative partisanship* [29].
- Edelson (Northeastern) + Politico: TikTok bersifat **"majoritarian"** — mengamplifikasi yang sudah populer secara luas (bukan yang paling ekstrem), dengan amplifikasi asimetris yang berubah-ubah menurut periode [30].
- AI Forensics 2025: 354 "Agentic AI Accounts", 43.000+ post AI, 4,5 miliar view → algoritma menghargai volume × kesesuaian format; ini vektor gaming [31].
- Dokumen gugatan Kentucky (T2, terbuka karena redaksi bocor): kebiasaan terbentuk setelah **260 video / ~35 menit**; alat limit waktu diukur dengan metrik "improving public trust", bukan pengurangan waktu pakai (A/B: 108,5 → 107 menit); algoritma **diubah setelah temuan internal bahwa FYP penuh "not attractive subjects"** sehingga mengamplifikasi kreator yang dianggap "beautiful" [32][33]. Sejalan dengan panduan moderasi bocor 2020 (The Intercept) soal "ugly/poor/disabled" [34].

## 5. Kontrol dan gerbang distribusi (T1)

Sebelum ranking, ada gerbang kelayakan: moderasi, kategori FYF-ineligible (misinformasi, berat badan/ED, body ideal, konten di bawah 16 tahun, "unoriginal/low quality", manipulasi engagement), plus aturan region dan bahasa [1][35].
Tuas pengguna: "Not interested", filter kata/hashtag, refresh FYP (berisi video populer), dan feed non-personal (DSA Art. 38, hanya EU) [1][36]. Ada juga fitur "Why this video" yang diaudit akademik (ICWSM) [37].
Tuas platform: **"heating" (promosi) dan "filtering" (demosi)** — dipakai untuk tujuan komersial/other goals; setiap promosi ditinjau manusia; untuk AS, TTUSDS menandatangani keputusan promosi/demosi. Ini temuan faktual pengadilan, bukan tuduhan [3].

## 6. Konteks 2024–2026 yang mengubah objek penelitian

- D.C. Circuit (6 Des 2024): engine "originally developed by ByteDance"; 9 engineer Tiongkok mengembangkannya berkelanjutan; di-deploy di cloud Oracle; ByteDance tetap "completely in control of developing the Source Code ... including the Recommendation Engine" [3].
- 22 Jan 2026: JV USDS tutup — Oracle/Silver Lake/MGX 15% masing-masing, ByteDance 19,9%. JV **melatih-ulang, menguji, dan memperbarui algoritma rekomendasi di atas data user AS**, diamankan di cloud Oracle [38][39]. Efeknya: sekarang ada dua instans algoritma yang akan makin divergen; perubahan yang dirasakan user AS tidak otomatis berlaku global (dan sebaliknya).
- DSA: TikTok wajib menyediakan feed non-profiling, menjelaskan parameter utama (Art. 27), dan kini menghadapi temuan awal soal rabbit hole (Art. 34/35) [17][36].

## 7. Cara membacanya secara mekanistik

- Bukan "skor kualitas konten", tapi **expected-value per-request**: `score = Σ w_k · P(action_k | user, video, context)`, dengan suku negatif (skip, not-interested, author/tag yang sama berulang) lalu dibatasi constraint safety + diversity. Tidak ada kolam tetap; kompetisi terjadi antar-kandidat di tiap request [19].
- Karena tiap suku punya bobot yang di-tune dengan A/B test berkelanjutan, "menang algoritma" = menang di prediksi aksi yang *dianggap bagus saat ini* — bukan di kualitas artistik.
- Cold start = fase eksplorasi berat (video populer lintas kategori) → konvergen ke niche seiring bukti perilaku (200–1.000 video pertama) [27][28].
- Efek viral = loop: eksplorasi algoritma × herding manusia. Amplifikasi "majoritarian" menjelaskan kenapa video bisa meledak ke audiens yang tidak tertarik topik itu [30].

## 8. Sumber yang harus diabaikan

Banyak "reverse engineering TikTok algorithm" hari ini adalah **konten hasil LLM tanpa sumber**: dev.to "Day 36: TikTok For You Page", onenoughtone.com, ironclad.academy, algoroq.io, blog pribadi "Engineering a Viral Recommendation Engine". Angka yang mereka tulis (ranker 500M parameter, "200+ fitur", 1.000 kandidat, 73k QPS, 34 juta upload/hari) tidak punya rujukan dan bukan berasal dari ByteDance. Self-media Tiongkok juga memproduksi formula karangan ("R = Σ(P×C×E×S×L)", "推荐算法白皮书 4.0", "parameter naik 10x dalam setahun" — yang terakhir ada di laporan 虎嗅 dari pernyataan eksekutif, tapi tetap tanpa dokumentasi) [40]. Tes praktis: kalau sebuah klaim memberi angka presisi ("completion >45% naik pool"), tanya sumber, sampel, tanggal, cakupan — kalau tidak ada, itu hipotesis.

## Daftar Sumber

1. TikTok, Introduction to the TikTok recommendation system — https://www.tiktok.com/safety/en/policies-and-engagement/recommendation-system
2. Douyin Safety & Trust Center, 什么是推荐系统 — https://trust.douyin.com/algorithm
3. TikTok Inc. v. Garland, D.C. Cir. No. 24-1113, opinion 6 Des 2024 — https://media.cadc.uscourts.gov/opinions/docs/2024/12/24-1113-2088317.pdf
4. 抖音首次公开推荐算法原理 (open day, Apr 2025) — https://www.ithome.com/0/841/836.htm ; 新华网 — http://www.xinhuanet.com/tech/20250416/cb30d07cc64f497b938b82f551204e05/c.html
5. Deep Retrieval, ByteDance — https://arxiv.org/abs/2007.07203
6. Trinity: Syncretizing Multi-/Long-tail/Long-term Interests All in One (Douyin retrieval) — https://arxiv.org/abs/2402.02842
7. 澎湃新闻, 抖音首度披露算法机制 (Apr 2025) — https://www.thepaper.cn/newsDetail_forward_30665269
8. TikTok Newsroom, How TikTok recommends videos #ForYou (Jun 2020) — https://newsroom.tiktok.com/en-us/how-tiktok-recommends-videos-for-you
9. Monolith: Real Time Recommendation System With Collisionless Embedding Table — https://arxiv.org/abs/2209.07663
10. bytedance/monolith (repo, archived) — https://github.com/bytedance/monolith
11. HLLM: Hierarchical LLMs for Item and User Modeling — https://arxiv.org/abs/2409.12740
12. LONGER: Scaling Up Long Sequence Modeling in Industrial Recommenders — https://arxiv.org/abs/2505.04421
13. Interest Clock: Time Perception in Real-Time Streaming Recommendation System (SIGIR 2024) — https://arxiv.org/abs/2404.19357
14. Long-Term Interest Clock — https://arxiv.org/abs/2501.15817
15. X-Rec Technical Report (deployed on TikTok vertical retrieval) — https://arxiv.org/pdf/2609.29180v1
16. NYT (Ben Smith), How TikTok Reads Your Mind — dokumen internal "TikTok Algo 101" — https://www.nytimes.com/2021/12/05/business/media/tiktok-algorithm.html
17. European Commission, preliminary findings on TikTok FYF (5 Nov 2026) — https://ec.europa.eu/commission/presscorner/detail/en/ip_26_2361
18. WSJ, Inside TikTok's Algorithm: A WSJ Video Investigation (Jul 2021) — https://www.wsj.com/tech/tiktok-algorithm-video-investigation-11626877477
19. Douyin's Recommendation Algorithm: Separating Official Disclosures, Paper Evidence, and Marketing Myths — https://blog.lynxflow.co/en/posts/douyin-recommendation-algorithm-reverse-analysis-2026/
20. How the TikTok Algorithm Works in 2026, Without the Myths (status per klaim) — https://tokconnect.com/guides/how-the-tiktok-algorithm-works/
21. 浙商证券, 抖音专题报告 (2021) — https://pdf.dfcfw.com/pdf/H3_AP202106021495530594_1.pdf
22. ABC News, leaked Douyin censorship manuals ("traffic pool", four levels of human checks, Jun 2025) — https://www.abc.net.au/news/2025-06-04/beijing-ai-and-censors-erase-tiananmen-square-massacre/105370772
23. TikTok Support, Content violations and bans ("second look when it gains popularity") — https://support.tiktok.com/en/safety-hc/account-and-user-safety/content-violations-and-bans
24. 虎嗅, 抖音回应算法治理 (2026) — https://huxiu.com/article/4902116.html
25. CCDH, Deadly by Design (Des 2022) + AP News — https://apnews.com/article/technology-health-eating-disorders-center-teens-0C8AE73F44926FA3DAF66BD7CAF3AD43
26. Amnesty International, Driven into Darkness (Nov 2023) — https://www.amnesty.org/en/latest/news/2023/11/tiktok-risks-pushing-children-towards-harmful-content/
27. Dynamics of Algorithmic Content Amplification on TikTok — https://arxiv.org/html/2503.20231
28. TikTok and the Art of Personalization (exploration vs exploitation) — https://arxiv.org/abs/2403.12410
29. TikTok's recommendations skewed towards Republican content (2024 race) — https://arxiv.org/html/2501.17831
30. Northeastern/Politico, Anatomy of a scroll — https://www.politico.eu/article/anatomy-scroll-inside-tiktok-ai-powered-algorithm-israel-palestine-war/
31. AI Forensics, Prompt, Upload, Repeat: Agentic AI Accounts — https://aiforensics.org/work/agentic-ai-accounts
32. NPR/Kentucky Public Radio, unredacted TikTok lawsuit documents — https://www.npr.org/2024/10/11/g-s1-27676/tiktok-redacted-documents-in-teen-safety-lawsuit-revealed
33. AP, TikTok aware of risks (Kentucky complaint) — http://www1.wbrz.com/news/tiktok-was-aware-of-risks-kids-and-teens-face-on-its-platform-legal-document-alleges
34. The Intercept, TikTok told moderators to suppress posts by the "ugly" and "poor" (2020) — https://theintercept.com/2020/03/16/tiktok-app-moderators-users-discrimination/
35. TikTok Community Guidelines, For You feed eligibility standards — https://www.tiktok.com/community-guidelines/en/fyf-standards
36. TikTok Newsroom, DSA commitments update (non-personalised feed) — https://newsroom.tiktok.com/en-eu/fulfilling-commitments-dsa-update
37. ICWSM, Auditing Algorithmic Explanations of Social Media Feeds: TikTok Video Explanations — https://ojs.aaai.org/index.php/ICWSM/article/download/31376/33536/35432
38. TikTok Newsroom, Announcement from the new TikTok USDS Joint Venture LLC — https://newsroom.tiktok.com/announcement-from-the-new-tiktok-usds-joint-venture-llc
39. Reuters, TikTok seals deal for US joint venture (23 Jan 2026) — https://www.reuters.com/world/china/tiktok-reaches-deal-new-us-joint-venture-avoid-american-ban-2026-01-23/
40. 虎嗅/新浪, 抖音精选流量规则转向 (2026) — https://huxiu.com/brief/293267.html
