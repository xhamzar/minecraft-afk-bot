function ruleDecision(world) {
  if (world.health <= 6 || world.hostiles.length >= 3) return { task: 'escape', priority: 100, reason: 'Bahaya langsung terdeteksi' };
  if (world.hunger <= 12) return { task: 'eat', priority: 95, reason: 'Hunger rendah' };
  if (world.hostiles.length && world.health > 12) return { task: 'combat', priority: 85, reason: 'Monster mengancam' };
  if (world.isNight) return { task: 'sleep', priority: 80, reason: 'Malam hari; cari tempat aman' };
  if (world.inventoryFree <= 2) return { task: 'store', priority: 70, reason: 'Inventory hampir penuh' };
  if (!world.hasFood) return { task: 'hunt', priority: 60, reason: 'Persediaan makanan habis' };
  if (!world.hasWood) return { task: 'mine', target: 'oak_log', priority: 55, reason: 'Butuh kayu dasar' };
  return { task: 'explore', priority: 30, reason: 'Eksplorasi aman' };
}
module.exports = { ruleDecision };
