const fs = require('node:fs');
const path = require('node:path');
class Logger {
  constructor(file) { this.file = file; fs.mkdirSync(path.dirname(file), { recursive: true }); }
  write(level, message, details = {}) {
    const safe = JSON.parse(JSON.stringify(details, (key, value) => /key|token|password|authorization/i.test(key) ? '[REDACTED]' : value));
    fs.appendFileSync(this.file, JSON.stringify({ time: new Date().toISOString(), level, message, ...safe }) + '\n');
    console[level === 'error' ? 'error' : 'log'](`[${level}] ${message}`);
  }
  info(message, details) { this.write('info', message, details); }
  warn(message, details) { this.write('warn', message, details); }
  error(message, details) { this.write('error', message, details); }
}
module.exports = { Logger };
