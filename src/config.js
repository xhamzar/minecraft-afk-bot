const fs = require('node:fs');
const path = require('node:path');
const { resolveSecret } = require('./security/secrets');
function envValue(value, fallback) {
  if (typeof value === 'string' && value.startsWith('env:')) return process.env[value.slice(4)] || fallback;
  return value ?? fallback;
}
function loadConfig(root = path.resolve(__dirname, '..')) {
  const bot = JSON.parse(fs.readFileSync(path.join(root, 'config/bot.json'), 'utf8'));
  const ai = JSON.parse(fs.readFileSync(path.join(root, 'config/ai.json'), 'utf8'));
  const legacyPath = path.join(root, 'config.json');
  // require() intentionally preserves compatibility with deployment config overrides.
  const legacy = fs.existsSync(legacyPath) ? require(legacyPath) : {};
  bot.server.host = process.env.BOT_HOST || envValue(bot.server.host, legacy.serverHost || 'localhost');
  bot.server.port = Number(process.env.BOT_PORT || legacy.serverPort || bot.server.port);
  bot.server.username = process.env.BOT_USERNAME || envValue(bot.server.username, legacy.botUsername || 'AIPlayer');
  bot.server.auth = process.env.BOT_AUTH || bot.server.auth;
  bot.server.viewDistance = legacy.botChunk || bot.server.viewDistance;
  bot.dashboard.port = Number(process.env.DASHBOARD_PORT || bot.dashboard.port);
  bot.dashboard.token = envValue(bot.dashboard.token, '');
  bot.memoryPath = path.resolve(root, bot.memoryPath);
  bot.logPath = path.resolve(root, bot.logPath);
  ai.providers = ai.providers.map((provider) => ({ ...provider, api_key: resolveSecret(provider.api_key) }));
  return { bot, ai, root };
}
module.exports = { loadConfig };
