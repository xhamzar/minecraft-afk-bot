const fs = require('node:fs');
const path = require('node:path');
class JsonDatabase {
  constructor(file, defaults = {}) {
    this.file = file;
    this.defaults = structuredClone(defaults);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    this.data = this.read();
  }
  read() {
    try { return { ...structuredClone(this.defaults), ...JSON.parse(fs.readFileSync(this.file, 'utf8')) }; }
    catch (error) {
      if (error.code !== 'ENOENT') throw error;
      return structuredClone(this.defaults);
    }
  }
  get(key, fallback) { return this.data[key] ?? fallback; }
  set(key, value) { this.data[key] = value; this.flush(); return value; }
  update(mutator) { mutator(this.data); this.flush(); return this.data; }
  flush() {
    const temporary = `${this.file}.${process.pid}.tmp`;
    fs.writeFileSync(temporary, JSON.stringify(this.data, null, 2));
    fs.renameSync(temporary, this.file);
  }
}
module.exports = { JsonDatabase };
