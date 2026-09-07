const mineflayer = require('mineflayer');
const express = require('express');
const config = require('./config.json');

// =======================
// WEB SERVER
// =======================
const app = express();
let botStatus = "Starting...";
let reconnectCount = 0;
let startTime = Date.now();

app.get('/', (req, res) => {
    let uptime = Math.floor((Date.now() - startTime) / 1000);
    res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>Minecraft AFK Bot</title>
        <style>
            body { background:#111; color:white; font-family:Arial; text-align:center; padding:40px; }
            .box { background:#222; padding:25px; border-radius:15px; max-width:500px; margin:auto; }
            .online { color:#00ff66; }
            .offline { color:#ff4444; }
        </style>
    </head>
    <body>
    <div class="box">
        <h1>🤖 Minecraft AFK Bot</h1>
        <h2 class="${botStatus.includes('Online') ? 'online' : 'offline'}">
            🟢 ${botStatus}
        </h2>
        <p>Bot Name: <b>${config.botUsername}</b></p>
        <p>Server: <b>${config.serverHost}:${config.serverPort}</b></p>
        <p>Reconnect: <b>${reconnectCount}</b></p>
        <p>Uptime: <b>${uptime}s</b></p>
    </div>
    </body>
    </html>
    `);
});

app.listen(7860, () => {
    console.log("🌐 Web aktif port 7860");
});

// =======================
// MINECRAFT BOT
// =======================
let isReconnecting = false;
let afkInterval = null;

function createBot() {
    isReconnecting = false;

    const bot = mineflayer.createBot({
        host: config.serverHost,
        port: config.serverPort,
        username: config.botUsername,
        auth: 'offline',
        version: false, // Auto-detect version
        viewDistance: config.botChunk || 'tiny'
    });

    // 1. Ditolak / Di-kick Server
    bot.on('kicked', (reason) => {
        console.log(`❌ Di-kick dari server! Alasan:`, reason);
    });

    // 2. Berhasil Masuk Server
    bot.on('spawn', () => {
        botStatus = "Online";
        console.log(`✅ ${config.botUsername} berhasil masuk server.`);

        // Anti-AFK Halus (Rotasi Kepala & Swing Arm)
        // Mencegah deteksi Anti-Cheat dari gerakan bolak-balik fisik
        if (afkInterval) clearInterval(afkInterval);
        
        afkInterval = setInterval(() => {
            if (!bot.entity) return;

            // Putar arah pandang secara acak (terlihat alami)
            const yaw = (Math.random() - 0.5) * Math.PI;
            const pitch = (Math.random() - 0.5) * (Math.PI / 4);
            bot.look(yaw, pitch, true);

            // Ayunkan tangan secara acak
            bot.swingArm('right');
        }, 8000); // Setiap 8 detik
    });

    // 3. Otomatis Login (Jika Server Memakai /login atau /register)
    bot.on('messagestr', (message) => {
        console.log("[SERVER]", message);

        const msgLower = message.toLowerCase();
        if (msgLower.includes('/login')) {
            const password = config.password || "password123";
            bot.chat(`/login ${password}`);
        } else if (msgLower.includes('/register')) {
            const password = config.password || "password123";
            bot.chat(`/register ${password} ${password}`);
        }
    });

    // 4. Penanganan Terputus (Disconnect/End)
    bot.on('end', () => {
        botStatus = "Offline - Reconnecting";
        console.log("⛔ Bot terputus dari server.");

        if (afkInterval) clearInterval(afkInterval);

        // Mencegah penumpukan instance bot
        if (!isReconnecting) {
            isReconnecting = true;
            reconnectCount++;
            console.log("⏳ Mencoba menghubungkan kembali dalam 15 detik...");
            setTimeout(() => {
                createBot();
            }, 15000); // Delay 15 detik agar server memproses logout
        }
    });

    // 5. Penanganan Error Protocol/Network
    bot.on('error', (err) => {
        console.log("⚠️ Error Bot:", err.message);
    });
}

// START BOT
createBot();
