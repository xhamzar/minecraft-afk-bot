const HOSTILES = new Set(['zombie', 'skeleton', 'creeper', 'spider', 'witch', 'drowned', 'husk', 'phantom', 'pillager']);
module.exports = {
  name: 'combat',
  tasks: ['combat', 'hunt'],
  async execute(task, { bot, human }) {
    const names = task.task === 'combat' ? HOSTILES : new Set(['cow', 'pig', 'chicken', 'sheep', 'rabbit']);
    const target = Object.values(bot.entities)
      .filter((entity) => entity.type !== 'player' && names.has(entity.name) && entity.position.distanceTo(bot.entity.position) < 16)
      .sort((a, b) => a.position.distanceTo(bot.entity.position) - b.position.distanceTo(bot.entity.position))[0];
    if (!target) throw new Error(task.task === 'combat' ? 'Monster tidak ditemukan' : 'Hewan buruan tidak ditemukan');
    const armorSlots = { helmet: 'head', chestplate: 'torso', leggings: 'legs', boots: 'feet' };
    for (const [suffix, destination] of Object.entries(armorSlots)) {
      const armor = bot.inventory.items().filter((item) => item.name.endsWith(suffix))
        .sort((a, b) => ['leather', 'golden', 'chainmail', 'iron', 'diamond', 'netherite'].findIndex((type) => b.name.startsWith(type))
          - ['leather', 'golden', 'chainmail', 'iron', 'diamond', 'netherite'].findIndex((type) => a.name.startsWith(type)))[0];
      if (armor) await bot.equip(armor, destination);
    }
    const weapon = bot.inventory.items().filter((item) => /_sword$|_axe$/.test(item.name))
      .sort((a, b) => (b.name.includes('diamond') ? 2 : 0) - (a.name.includes('diamond') ? 2 : 0))[0];
    if (weapon) await bot.equip(weapon, 'hand');
    await human.lookAt(target.position.offset(0, target.height || 1, 0));
    if (target.position.distanceTo(bot.entity.position) > 3.5) await bot.pathfinder.goto(new GoalFollowSafe(target, 2));
    bot.attack(target);
    return `menyerang ${target.name}`;
  }
};

function GoalFollowSafe(entity, range) {
  const { goals: { GoalFollow } } = require('mineflayer-pathfinder');
  return new GoalFollow(entity, range);
}
