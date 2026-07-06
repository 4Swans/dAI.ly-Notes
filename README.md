# dAI.ly Notes

Aplikasi daily notes berbasis kalender dengan agentic AI assistant. UI dibuat dari design system awal, lalu dikembangkan menjadi aplikasi yang dapat menyimpan note per tanggal, menerima voice command, dan mengirim konteks note ke Dify.

## Fitur

- Calendar bulanan dengan indikator tanggal yang memiliki note.
- Editor daily note per tanggal dengan autosave ke `localStorage`.
- AI assistant panel untuk chat dan contextual suggestion.
- Voice chat via Web Speech API di browser Chrome/Edge.
- Proxy server `/api/agent` agar `DIFY_API_KEY` tidak berada di client.
- Dukungan Dify Workflow (`/workflows/run`) dan Dify Chat/Agent (`/chat-messages`).

## Cara menjalankan

1. Pastikan Node.js 18+ tersedia.
2. Masuk ke folder proyek:

```bash
cd "C:\Kuliah\Semester 8\PJAR\dAI.ly notes project\stitch_daily_notes_ai_assistant"
```

3. Buat file `.env` dari contoh:

```bash
copy .env.example .env
```

4. Isi `DIFY_API_KEY` di `.env`.
5. Jalankan server:

```bash
npm start
```

6. Buka `http://localhost:5173`.

## Konfigurasi Dify

Default proyek memakai workflow mode:

```env
DIFY_MODE=workflow
DIFY_BASE_URL=https://api.dify.ai/v1
DIFY_API_KEY=app-your-dify-api-key
```

Untuk Dify Workflow, server mengirim input berikut ke `/workflows/run`:

```json
{
  "prompt": "perintah user",
  "selected_date": "2026-07-06",
  "note_title": "judul note aktif",
  "note_body": "isi note aktif",
  "notes_json": "{...semua note lokal...}"
}
```

Buat workflow Dify agar output akhirnya berupa JSON valid seperti ini:

```json
{
  "reply": "Sudah saya tambahkan action item ke note besok.",
  "actions": [
    {
      "type": "append_note",
      "date": "2026-07-07",
      "text": "Action item: Review rancangan workflow Dify jam 09.00."
    }
  ]
}
```

Action yang didukung client:

- `set_note`: set `title`, `body`, atau `content` untuk tanggal tertentu.
- `append_note`: tambah `text` atau `content` ke akhir note.
- `replace_text`: ganti teks dalam note dengan `find` dan `replace`.
- `move_note`: salin note dari `date` ke `to`, opsional `deleteOriginal: true`.

## Mode Chat/Agent Dify

Jika app Dify yang dibuat adalah Chatflow/Agent, ubah:

```env
DIFY_MODE=chat
```

Server akan memanggil `/chat-messages` dengan `response_mode: blocking` dan tetap meminta model membalas JSON `reply/actions`.

## Catatan penting

- Notes saat ini disimpan lokal di browser. Untuk multi-device, langkah berikutnya adalah menambah database seperti SQLite/PostgreSQL dan endpoint CRUD notes.
- Voice recognition memakai fitur browser, bukan Dify STT. Jika ingin voice server-side, tambahkan endpoint upload audio dan sambungkan ke STT provider.
- API key Dify jangan dimasukkan ke `app.js` atau file client lainnya.
