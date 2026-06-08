# PANDUAN DEPLOY — Elsewedy Inspection Checklist
## PT Elsewedy Electric Indonesia · Dept. Winding

---

## LANGKAH 1 — Setup Supabase (jalankan SQL dulu)

1. Buka https://supabase.com/dashboard
2. Pilih project: xbwjkehfavzpmyliubqu
3. Klik menu "SQL Editor" di sidebar kiri
4. Klik "New query"
5. Copy-paste isi file `inspection_schema.sql`
6. Klik tombol "Run" (atau Ctrl+Enter)
7. Pastikan muncul pesan "Success. No rows returned"

---

## LANGKAH 2 — Upload ke GitHub

1. Buka https://github.com dan login
2. Klik tombol "+" → "New repository"
3. Nama repo: `elsewedy-inspection`
4. Visibility: Private
5. Klik "Create repository"
6. Upload semua file project ini:
   - Klik "uploading an existing file"
   - Upload file satu per satu ATAU zip seluruh folder lalu extract

Struktur folder yang harus ada di GitHub:
```
elsewedy-inspection/
├── app/
│   ├── layout.js
│   ├── page.js
│   └── globals.css
├── components/
│   └── InspectionApp.js
├── lib/
│   ├── supabase.js
│   └── checklist-data.js
├── public/
│   └── manifest.json
├── package.json
└── next.config.js
```

CATATAN: Jangan upload file `.env.local` ke GitHub!

---

## LANGKAH 3 — Deploy ke Vercel

1. Buka https://vercel.com dan login
2. Klik "Add New..." → "Project"
3. Pilih repository `elsewedy-inspection` dari GitHub
4. Framework: Next.js (otomatis terdeteksi)
5. Sebelum klik Deploy, buka "Environment Variables":
   - Tambah variable 1:
     - Name:  NEXT_PUBLIC_SUPABASE_URL
     - Value: https://xbwjkehfavzpmyliubqu.supabase.co
   - Tambah variable 2:
     - Name:  NEXT_PUBLIC_SUPABASE_ANON_KEY
     - Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhid2prZWhmYXZ6cG15bGl1YnF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA4MzkzODEsImV4cCI6MjA5NjQxNTM4MX0.1WD5K4SJZ8ZOcMoVdq0LXY6WDpFfEnWS5DOq7Sq660E
6. Klik "Deploy"
7. Tunggu ~2 menit hingga selesai

---

## LANGKAH 4 — Test & Install PWA

Setelah deploy selesai:
1. Vercel akan memberi URL seperti: https://elsewedy-inspection.vercel.app
2. Buka URL itu di HP/tablet operator
3. Di Chrome Android: ketuk menu ⋮ → "Add to Home screen"
4. App akan terinstall seperti aplikasi native

---

## CARA DISTRIBUSI KE OPERATOR

Cukup bagikan link Vercel ke semua operator via WhatsApp.
Mereka bisa langsung buka di browser, tidak perlu install dari Play Store.

---

## TROUBLESHOOTING

### Error "relation inspection_reports does not exist"
→ SQL schema belum dijalankan. Ulangi Langkah 1.

### Error "Failed to fetch" saat submit
→ Cek koneksi internet. Supabase butuh internet untuk menyimpan data.

### Halaman kosong setelah deploy
→ Cek Environment Variables di Vercel sudah benar.
