const crypto = require('node:crypto');
const chunks = [];
process.stdin.on('data', (chunk) => chunks.push(chunk));
process.stdin.on('end', () => {
  const master = process.env.AI_MASTER_KEY;
  if (!master) throw new Error('Set AI_MASTER_KEY before encrypting a secret');
  const plaintext = Buffer.concat(chunks).toString('utf8').replace(/[\r\n]+$/, '');
  if (!plaintext) throw new Error('Pass the secret through standard input');
  const salt = crypto.randomBytes(16);
  const iv = crypto.randomBytes(12);
  const key = crypto.scryptSync(master, salt, 32);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  process.stdout.write(`enc:v1:${salt.toString('base64')}:${iv.toString('base64')}:${cipher.getAuthTag().toString('base64')}:${encrypted.toString('base64')}\n`);
});
