# Tutorial: Membuat Dify Workflow untuk dAI.ly Notes (dengan Gemini)

> **Versi:** Dify ≥ 0.9 · Model: Gemini 2.0 Flash / Gemini 1.5 Pro  
> **Estimasi waktu:** 20–30 menit

---

## Daftar Isi

1. [Prasyarat](#1-prasyarat)
2. [Setup Dify & Tambahkan Model Gemini](#2-setup-dify--tambahkan-model-gemini)
3. [Buat Workflow Baru](#3-buat-workflow-baru)
4. [Konfigurasi Input Variables](#4-konfigurasi-input-variables)
5. [Tambahkan LLM Node (Gemini)](#5-tambahkan-llm-node-gemini)
6. [System Prompt Lengkap](#6-system-prompt-lengkap)
7. [Tambahkan Code Node untuk Validasi JSON](#7-tambahkan-code-node-untuk-validasi-json)
8. [Konfigurasi End Node](#8-konfigurasi-end-node)
9. [Test Workflow dari Dify UI](#9-test-workflow-dari-dify-ui)
10. [Hubungkan ke Aplikasi dAI.ly Notes](#10-hubungkan-ke-aplikasi-daily-notes)
11. [Troubleshooting](#11-troubleshooting)

---

## 1. Prasyarat

| Kebutuhan | Keterangan |
|-----------|-----------|
| Akun Dify | [dify.ai](https://dify.ai) (cloud) atau self-hosted |
| Google AI Studio API Key | Dapatkan di [aistudio.google.com](https://aistudio.google.com/app/apikey) — **gratis** |
| Node.js ≥ 18 | Untuk menjalankan server dAI.ly Notes |
| Browser Chrome/Edge | Untuk fitur Web Speech API (voice) |

---

## 2. Setup Dify & Tambahkan Model Gemini

### 2a. Masuk ke Dify

1. Buka [cloud.dify.ai](https://cloud.dify.ai) atau URL self-hosted kamu.
2. Login atau daftar akun baru.

### 2b. Tambahkan Model Provider Google

1. Klik avatar / nama profil → **Settings**.
2. Di sidebar kiri, pilih **Model Provider**.
3. Cari kartu **Google** → klik **Setup** atau **Add**.
4. Isi field `Google API Key` dengan key dari Google AI Studio.
5. Klik **Save** → konfirmasi connection berhasil (centang hijau).

### 2c. Pilih Model Default (opsional)

Di bagian **System Model Settings**, kamu bisa set:

- **LLM:** `gemini-2.0-flash` (cepat, murah, cocok untuk chatbot)
- Atau: `gemini-1.5-pro` (lebih pintar untuk reasoning kompleks)

---

## 3. Buat Workflow Baru

1. Dari dashboard Dify, klik tombol **Create App** (pojok kanan atas atau tengah).
2. Pilih tipe: **Workflow** ← *(bukan Chatbot, bukan Agent)*
3. Beri nama: `dAI.ly Notes Agent`
4. Klik **Create**.

Kamu akan masuk ke **Workflow Editor** — canvas kosong dengan node **Start** dan **End** yang sudah ada.

---

## 4. Konfigurasi Input Variables

Node **Start** adalah titik masuk data dari aplikasi. Kita perlu mendefinisikan variabel input.

1. Klik node **Start** di canvas.
2. Di panel kanan, klik **+ Add Input Variable** untuk setiap variabel berikut:

| Variable Name | Type | Required | Description |
|---------------|------|----------|-------------|
| `prompt` | String | ✅ | Perintah user (teks atau hasil voice) |
| `selected_date` | String | ✅ | Tanggal aktif, format `YYYY-MM-DD` |
| `note_title` | String | ❌ | Judul note yang sedang dibuka |
| `note_body` | String | ❌ | Isi note yang sedang dibuka |
| `notes_json` | String | ❌ | JSON string semua note (max 80 entries) |

3. Setelah selesai, klik di luar panel untuk menutup.

---

## 5. Tambahkan LLM Node (Gemini)

1. Klik tombol **+** di bawah node **Start** (atau drag dari port output Start).
2. Pilih **LLM** dari menu node.
3. Rename node menjadi: `Gemini Agent`

### 5a. Konfigurasi Model

Di panel kanan node LLM:

- **Model:** Klik dropdown → pilih `Google` → pilih `gemini-2.0-flash` (atau `gemini-1.5-pro`).
- **Temperature:** `0.3` ← rendah agar output JSON konsisten
- **Max Tokens:** `1024`
- **Top P:** `0.8`

### 5b. Sambungkan dengan Start Node

Tarik koneksi dari output **Start** ke input **LLM node**. Garis koneksi harus berwarna biru.

---

## 6. System Prompt Lengkap

Di panel LLM node, ada dua bagian prompt:

### 6a. System Prompt

Salin teks berikut ke kolom **System**:

```
Kamu adalah agentic AI assistant untuk aplikasi daily notes bernama "dAI.ly Notes".

TUGAS UTAMA:
Analisa perintah user dan konteks note calendar, lalu hasilkan respons JSON yang tepat.

OUTPUT FORMAT:
Balas HANYA dengan JSON valid. Jangan tambahkan penjelasan di luar JSON.
Jangan wrap dalam markdown code block.

Format JSON:
{
  "reply": "Pesan singkat dan jelas untuk ditampilkan ke user (1-2 kalimat)",
  "actions": [
    // Array action yang akan dieksekusi. Bisa kosong []
  ]
}

JENIS ACTION YANG TERSEDIA:

1. set_note — Mengganti seluruh konten note
   { "type": "set_note", "date": "YYYY-MM-DD", "title": "...", "body": "..." }

2. append_note — Menambahkan teks ke akhir note
   { "type": "append_note", "date": "YYYY-MM-DD", "text": "..." }

3. replace_text — Mengganti teks tertentu dalam note
   { "type": "replace_text", "date": "YYYY-MM-DD", "find": "...", "replace": "..." }

4. move_note — Memindahkan note ke tanggal lain
   { "type": "move_note", "date": "YYYY-MM-DD", "to": "YYYY-MM-DD", "deleteOriginal": true }

5. delete_note — Menghapus note pada tanggal tertentu
   { "type": "delete_note", "date": "YYYY-MM-DD" }

ATURAN PENTING:
- Field "date" pada action menggunakan format YYYY-MM-DD
- Jika tidak disebutkan tanggal, gunakan selected_date
- "Besok" = selected_date + 1 hari, hitung dengan benar
- reply harus dalam Bahasa Indonesia yang ramah dan natural
- Jika perintah ambigu, tanyakan klarifikasi di field "reply" dan beri actions: []
- Jangan hapus note tanpa konfirmasi eksplisit dari user
```

### 6b. User Prompt

Di kolom **User**, gunakan template dengan variabel dari Start node:

```
Tanggal aktif: {{#start.selected_date#}}

Judul note saat ini: {{#start.note_title#}}

Isi note saat ini:
{{#start.note_body#}}

Konteks semua note (JSON):
{{#start.notes_json#}}

Perintah user:
{{#start.prompt#}}
```

> **Cara insert variabel:** Ketik `{{` lalu pilih variabel dari dropdown, atau klik ikon `{}` di toolbar.

---

## 7. Tambahkan Code Node untuk Validasi JSON

Node ini opsional tapi sangat direkomendasikan untuk memastikan output Gemini selalu berupa JSON valid.

1. Klik **+** setelah node LLM → pilih **Code**.
2. Rename: `Validate & Parse JSON`
3. **Language:** Python 3
4. **Input Variables:**
   - `raw_output` = `{{#Gemini Agent.text#}}`

5. **Code:**

```python
import json
import re

def main(raw_output: str) -> dict:
    text = raw_output.strip()
    
    # Hapus markdown code block jika ada
    text = re.sub(r'^```(?:json)?\s*', '', text, flags=re.IGNORECASE)
    text = re.sub(r'\s*```$', '', text)
    text = text.strip()
    
    # Coba parse JSON
    try:
        parsed = json.loads(text)
        
        # Validasi struktur
        if not isinstance(parsed, dict):
            raise ValueError("Output bukan object JSON")
        
        reply   = parsed.get("reply", "Perintah telah diproses.")
        actions = parsed.get("actions", [])
        
        if not isinstance(actions, list):
            actions = []
        
        return {
            "reply":   str(reply),
            "actions": json.dumps(actions),
            "valid":   True
        }
        
    except (json.JSONDecodeError, ValueError) as e:
        # Fallback: kembalikan teks mentah sebagai reply
        return {
            "reply":   text if text else "Perintah telah diproses.",
            "actions": "[]",
            "valid":   False
        }
```

6. **Output Variables harus didefinisikan manual** di panel kanan Code node.
   Di bagian **Output Variables**, klik **+ Add** untuk setiap variabel:

   | Variable Name | Type |
   |---------------|------|
   | `reply` | String |
   | `actions` | String |
   | `valid` | Boolean |

   > ⚠️ **Penting:** Dify **tidak** otomatis mendeteksi output dari return dict Python.
   > Nama variabel di sini **harus sama persis** dengan key yang di-`return` oleh fungsi `main()`.
   > Setelah disimpan, variabel ini bisa direferensikan di node berikutnya.

---

## 8. Konfigurasi End Node

1. Klik node **End**.
2. Di panel output, klik **+ Add Output Variable** dan tambahkan:

| Output Variable | Value |
|----------------|-------|
| `reply` | `{{#Validate & Parse JSON.reply#}}` |
| `action` | `{{#Validate & Parse JSON.actions#}}` |

> **Catatan nama variabel:** Aplikasi dAI.ly Notes mendukung **kedua bentuk** — `action` (singular) maupun `actions` (plural). Gunakan nama variabel yang sama persis dengan yang kamu definisikan di Code node output variables.

> Jika **tidak** menggunakan Code node, gunakan langsung dari LLM:
> - `reply` = `{{#Gemini Agent.text#}}`

3. Sambungkan koneksi: **Code Node → End Node**.

### Diagram Alur Final

```
[Start] → [Gemini Agent (LLM)] → [Validate & Parse JSON (Code)] → [End]
```

---

## 9. Test Workflow dari Dify UI

1. Klik tombol **Run** (▶) di pojok kanan atas canvas.
2. Panel test akan muncul di kanan. Isi input:

```json
{
  "prompt": "tambahkan catatan besok: review proposal jam 14.00",
  "selected_date": "2026-07-06",
  "note_title": "Planning Week",
  "note_body": "Hari ini fokus finishing laporan.",
  "notes_json": "{}"
}
```

3. Klik **Run** dan tunggu beberapa detik.
4. Output yang diharapkan:

```json
{
  "reply": "Siap! Saya sudah menambahkan catatan 'review proposal jam 14.00' ke note tanggal 7 Juli 2026.",
  "actions": "[{\"type\":\"append_note\",\"date\":\"2026-07-07\",\"text\":\"Review proposal jam 14.00\"}]"
}
```

5. Periksa output di tab **Trace** untuk debugging detail setiap node.

### Contoh Test Cases Lainnya

| Prompt | Expected Action Type |
|--------|---------------------|
| "Rapikan note hari ini" | `set_note` |
| "Ganti 'rapat' dengan 'meeting'" | `replace_text` |
| "Pindahkan note ini ke besok" | `move_note` |
| "Apa isi note kemarin?" | `reply` saja, `actions: []` |
| "Hapus note tanggal 1 Juli" | `delete_note` (dengan konfirmasi) |

---

## 10. Hubungkan ke Aplikasi dAI.ly Notes

### 10a. Dapatkan API Key Workflow

1. Di Dify, masuk ke app **dAI.ly Notes Agent**.
2. Klik tab **API Access** atau **Publish** → **API Keys**.
3. Klik **Create API Key** → copy key yang dihasilkan (format `app-xxxxxxxx`).

### 10b. Konfigurasi File `.env`

Di folder proyek dAI.ly Notes:

```bash
# Copy dari template
copy .env.example .env
```

Edit `.env`:

```env
PORT=5173
DIFY_BASE_URL=https://api.dify.ai/v1
DIFY_API_KEY=app-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx   # ← paste API key di sini
DIFY_MODE=workflow
DIFY_USER=daily-notes-user
DIFY_TIMEOUT_MS=30000
```

> Jika menggunakan Dify **self-hosted**, ubah `DIFY_BASE_URL` ke URL server kamu, contoh:
> `DIFY_BASE_URL=http://localhost/v1`

### 10c. Jalankan Server

```bash
cd "C:\Kuliah\Semester 8\PJAR\dAI.ly notes project\stitch_daily_notes_ai_assistant"
npm start
```

Output yang benar:

```
[2026-07-06T...] → dAI.ly Notes running at http://localhost:5173
[2026-07-06T...] → Dify mode: workflow | base: https://api.dify.ai/v1
[2026-07-06T...] → API key configured: yes
```

### 10d. Buka Aplikasi

Buka browser Chrome atau Edge → `http://localhost:5173`

Di panel AI Insights (kanan), status pill harus berubah menjadi **"Dify ready"** (hijau).

Coba kirim perintah:
- *"tambahkan action item: review laporan PJAR jam 10 besok"*
- *"rapikan note hari ini jadi lebih terstruktur"*
- *"apa yang perlu saya lakukan besok?"*

---

## 11. Troubleshooting

### Status pill tetap "Error" atau "No API key"

- Pastikan file `.env` sudah dibuat (bukan hanya `.env.example`)
- Pastikan `DIFY_API_KEY` diisi dengan key yang benar
- Restart server: `Ctrl+C` lalu `npm start`

### Output Gemini tidak berupa JSON

- Naikkan `temperature` ke `0` atau turunkan ke `0.1`
- Pastikan Code node **Validate & Parse JSON** sudah terhubung
- Cek System Prompt — pastikan tidak ada karakter aneh

### Workflow berjalan tapi `actions` tidak diterapkan

- Cek format output End node — harus ada field `reply` dan `actions`
- `actions` harus berupa **JSON string**, bukan object (Code node sudah menangani ini)
- Buka DevTools browser → Network → lihat response dari `/api/agent`

### Voice chat tidak bekerja

- Gunakan Chrome atau Edge (bukan Firefox)
- Pastikan browser punya akses mikrofon (klik 🔒 di address bar)
- Coba refresh halaman dan grant ulang permission mikrofon

### Timeout "Dify request timed out"

- Naikkan `DIFY_TIMEOUT_MS` di `.env` ke `60000` (60 detik)
- Cek koneksi internet
- Coba model yang lebih cepat: `gemini-2.0-flash` lebih cepat dari `gemini-1.5-pro`

### Error "conversation_id invalid" (mode chat)

- Hapus localStorage di browser: DevTools → Application → Local Storage → Delete `daily-notes-conversation-id`
- Refresh halaman

---

## Referensi

- [Dify Workflow Documentation](https://docs.dify.ai/guides/workflow)
- [Dify API Reference — Workflow Run](https://docs.dify.ai/api-reference/workflow/run-workflow)
- [Google AI Studio — Get API Key](https://aistudio.google.com/app/apikey)
- [Gemini Models Overview](https://ai.google.dev/gemini-api/docs/models/gemini)

---

*Tutorial ini dibuat untuk proyek dAI.ly Notes — PJAR Semester 8*
