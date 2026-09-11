class LearningSystem {
  constructor(memory) { this.memory = memory; }
  success(task, details) { this.memory.experience(`${task} berhasil`, `Strategi ${task} dapat digunakan kembali`, details || 'success'); }
  failure(task, error) {
    const message = String(error?.message || error).slice(0, 160);
    const lesson = /lava/i.test(message) ? 'Jaga jarak dari lava dan gunakan jalur alternatif' : `Evaluasi target dan perlengkapan sebelum ${task}`;
    this.memory.experience(`${task} gagal: ${message}`, lesson, 'failure');
  }
}
module.exports = { LearningSystem };
