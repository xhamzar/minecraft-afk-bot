const crypto = require('node:crypto');
function resolveSecret(value, env = process.env) {
  if (!value) return '';
  if (value.startsWith('env:')) return env[value.slice(4)] || '';
  if (!value.startsWith('enc:v1:')) return value;
  const master = env.AI_MASTER_KEY;
  if (!master) throw new Error('AI_MASTER_KEY is required for encrypted secrets');
  const [, , salt64, iv64, tag64, data64] = value.split(':');
  if (![salt64, iv64, tag64, data64].every(Boolean)) throw new Error('Invalid encrypted secret format');
  const key = crypto.scryptSync(master, Buffer.from(salt64, 'base64'), 32);
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(iv64, 'base64'));
  decipher.setAuthTag(Buffer.from(tag64, 'base64'));
  return Buffer.concat([decipher.update(Buffer.from(data64, 'base64')), decipher.final()]).toString('utf8');
}
function secureEqual(actual, expected) {
  const a = Buffer.from(actual || '');
  const b = Buffer.from(expected || '');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
module.exports = { resolveSecret, secureEqual };
