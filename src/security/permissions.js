function canCommand(username, owners) {
  return Array.isArray(owners) && owners.some((owner) => owner.toLowerCase() === String(username).toLowerCase());
}
function parseGoal(text) {
  const clean = String(text).replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, 240);
  if (!clean) throw new Error('Perintah kosong');
  const lower = clean.toLowerCase();
  if (/buat|bangun/.test(lower) && /rumah|shelter|base/.test(lower)) return { task: 'build', priority: 75, reason: clean };
  if (/diamond|berlian/.test(lower)) return { task: 'mine', target: 'diamond_ore', priority: 70, reason: clean };
  if (/kayu|wood|log/.test(lower)) return { task: 'mine', target: 'oak_log', priority: 60, reason: clean };
  if (/makan/.test(lower)) return { task: 'eat', priority: 95, reason: clean };
  if (/tani|farm|panen/.test(lower)) return { task: 'farm', priority: 60, reason: clean };
  if (/jelajah|explore/.test(lower)) return { task: 'explore', priority: 45, reason: clean };
  return { goal: clean, task: null, priority: 50, reason: clean };
}
module.exports = { canCommand, parseGoal };
