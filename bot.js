const mineflayer = require('mineflayer');
const config = require('./config.json');

const STEP_INTERVAL = 1500;
const JUMP_DURATION = 500;

function createBot() {
  const bot = mineflayer.createBot({
    host: config.serverHost,
    port: config.serverPort,
    username: config.botUsername,

    // jika server offline mode (Cracked)
    auth: 'offline',

    // auto detect versi server
    version: false,

    viewDistance: config.botChunk || 'tiny'
  });

  let movementPhase = 0;
  let movementInterval = null;

  bot.on('spawn', () => {
    console.log(`✅ ${config.botUsername} berhasil masuk server`);

    setTimeout(() => {
      bot.setControlState('sneak', true);
      console.log('🤖 Bot AFK aktif (Crouching)');
    }, 3000);

    // Jalankan siklus pergerakan
    setTimeout(movementCycle, STEP_INTERVAL);
  });

  // Gerakan Anti-AFK
  function movementCycle() {
    if (!bot.entity) return;

    switch (movementPhase) {
      case 0:
        bot.setControlState('forward', true);
        bot.setControlState('back', false);
        bot.setControlState('jump', false);
        break;

      case 1:
        bot.setControlState('forward', false);
        bot.setControlState('back', true);
        bot.setControlState('jump', false);
        break;

      case 2:
        bot.setControlState('forward', false);
        bot.setControlState('back', false);
        bot.setControlState('jump', true);

        setTimeout(() => {
          bot.setControlState('jump', false);
        }, JUMP_DURATION);
        break;

      case 3:
        bot.setControlState('forward', false);
        bot.setControlState('back', false);
        bot.setControlState('jump', false);
        break;
    }

    movementPhase = (movementPhase + 1) % 4;
    movementInterval = setTimeout(movementCycle, STEP_INTERVAL);
  }

  // Reconnect otomatis saat terputus
  bot.on('end', () => {
    console.log('⛔ Bot keluar server.');
    if (movementInterval) clearTimeout(movementInterval);

    console.log('🔄 Mencoba masuk ulang dalam 10 detik...');
    setTimeout(() => {
      createBot(); // Membuat instance bot baru
    }, 10000);
  });

  // Error handling
  bot.on('error', (err) => {
    console.log('⚠️ Error:', err.message);
  });

  // Log chat server
  bot.on('message', (message) => {
    console.log('[SERVER]', message.toString());
  });
}

// Jalankan bot pertama kali
createBot();
