# Minecraft AI Player Bot

Bot Minecraft Java Edition modular berbasis Mineflayer. Bot membaca kondisi dunia, menyusun prioritas survival/resource/build, mencoba planner LLM, lalu tetap berjalan dengan rule-based behavior ketika semua layanan AI offline.

> Gunakan hanya pada server yang mengizinkan bot. Modul humanizer membuat tempo gerak dan kamera lebih alami untuk kualitas permainan; proyek ini tidak menjanjikan atau mencoba melewati anti-cheat.

## Kemampuan

- Lifecycle Mineflayer dengan reconnect bertahap, pathfinding, sensor health/hunger/waktu/cuaca/monster/inventory.
- Planner AI tervalidasi dengan fallback rule-based untuk makan, kabur, tidur, bertarung, eksplorasi, mining, crafting, building, farming, hunting, dan storage.
- Router berprioritas untuk Gemini, OpenRouter, OpenAI, Anthropic, DeepSeek, Mistral, Hugging Face, Ollama, LM Studio, dan llama.cpp.
- Failover untuk timeout/network/quota/rate-limit, cooldown, limit request harian, statistik token, serta error terakhir.
- Short-term memory, lokasi penting, keputusan, dan experience/lesson jangka panjang dalam JSON atomik.
- Chat natural language terbatas pemilik, dashboard start/stop/command/provider/status/memory API, structured logging, dan redaksi secret.
- Plugin discovery otomatis dari `src/plugins/*.js`.

## Persyaratan

- Node.js 22 atau lebih baru (Node 24 direkomendasikan).
- Server Minecraft Java yang memang mengizinkan penggunaan bot.
- Untuk akun Microsoft, ubah `server.auth` menjadi `microsoft`; login device-code Mineflayer akan muncul pada terminal.

## Instalasi

```bash
npm ci
cp .env.example .env
```

File `.env` hanya contoh referensi dan tidak dimuat otomatis. Ekspor variabel yang diperlukan lewat shell/process manager, misalnya:

```bash
export BOT_HOST=127.0.0.1
export BOT_PORT=25565
export BOT_USERNAME=AIPlayer
export DASHBOARD_TOKEN='ganti-dengan-token-panjang'
npm start
```

Konfigurasi server ada di `config/bot.json`. Nilai dari environment mengambil prioritas; `config.json` lama tetap didukung agar deployment lama tidak rusak. Dashboard default hanya bind ke `127.0.0.1:7860`. Jika dashboard diekspos ke jaringan, wajib isi `DASHBOARD_TOKEN` dan gunakan reverse proxy HTTPS.

## AI provider

Edit `config/ai.json`, set `enabled: true`, lalu ekspor API key yang dirujuk. Jangan commit key secara langsung.

```bash
export GEMINI_API_KEY='...'
export OPENROUTER_API_KEY='...'
npm start
```

Provider lokal tidak membutuhkan key:

- Ollama: API default `http://127.0.0.1:11434`
- LM Studio: OpenAI-compatible API default `http://127.0.0.1:1234/v1`
- llama.cpp server: OpenAI-compatible API default `http://127.0.0.1:8080/v1`

`priority` lebih kecil dicoba lebih dulu. `limit: 0` berarti tanpa limit aplikasi; nilai lain adalah limit request per hari. Status tersimpan di `data/memory.json` sehingga restart tidak menghapus usage. Provider yang gagal masuk cooldown sebelum dicoba kembali.

Secret juga dapat dienkripsi menggunakan AES-256-GCM dan `AI_MASTER_KEY`. Hindari menaruh secret di argumen command line:

```bash
export AI_MASTER_KEY='passphrase-panjang-yang-disimpan-di-secret-manager'
read -rs API_SECRET
printf '%s' "$API_SECRET" | npm run --silent encrypt-secret
unset API_SECRET
```

Salin output `enc:v1:...` ke field `api_key`. Referensi `env:NAME` tetap menjadi cara yang paling sederhana.

## Interaksi

Tambahkan nama Minecraft yang dipercaya ke `owners` pada `config/bot.json`. Daftar kosong berarti semua perintah chat ditolak. Prefix default:

```text
!ai buat rumah dekat sungai
!ai cari diamond
!ai cari makanan
!ai jelajah
```

Perintah dashboard dapat dikirim dari panel **Command**. Survival kritis selalu dapat mengambil alih tugas biasa. Input dipotong 240 karakter, tidak pernah diteruskan ke shell, dan hasil planner hanya boleh memilih task dalam allowlist.

## Plugin baru

Buat file CommonJS baru di `src/plugins/`:

```js
module.exports = {
  name: 'example',
  tasks: ['example_task'],
  setup(context) {},
  async execute(task, { bot, human, memory, logger }) {
    return 'hasil aktivitas';
  }
};
```

Nama task harus unik. Tambahkan task baru ke allowlist `src/brain/reasoning.js` bila task boleh dipilih LLM. Plugin mempunyai akses ke bot, tetapi tetap harus membatasi target, menghormati permission server, dan memberi error yang dapat dipelajari learning system.

## Arsitektur

```text
src/
├── ai/          provider adapters, manager, router/failover
├── brain/       planner, rules, reasoning, emotions, learning, task queue
├── dashboard/   Express API dan control panel
├── database/    penyimpanan JSON atomik
├── human/       reaction delay dan natural camera
├── memory/      short/long-term/experience memory
├── plugins/     survival, mining, combat, exploration, building, farming
├── security/    secret resolution dan permissions
├── bot.js       Mineflayer controller
└── index.js     composition root
```

Alur keputusan:

```text
world sensor → survival priority → AI router → validated decision → plugin action
                                  ↘ provider gagal → provider berikut
                                  ↘ semua gagal → rule planner + memory
```

## Validasi

```bash
npm run check
```

Test mencakup prioritas survival, validasi output AI, automatic provider switching, mapping bahasa natural, permission default-deny, dan secret environment. Pengujian aksi dunia penuh memerlukan server development karena placement, recipe, dan metadata block bergantung versi Minecraft serta plugin server.

## Batas keselamatan

Bot tidak menyerang entity player, hanya menerima chat command dari `owners`, dan hanya menjalankan task allowlist. Backup world sebelum menguji building/mining. Mulailah di server lokal atau area yang memang disediakan untuk bot; beberapa kemampuan (diamond mining yang kompleks, desain rumah adaptif, perdagangan multi-step) adalah capability yang dapat dikembangkan melalui plugin dan pengalaman, bukan jaminan keberhasilan di setiap seed atau versi server.
