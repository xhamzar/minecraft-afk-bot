const { Vec3 } = require('vec3');
const { goals: { GoalNear } } = require('mineflayer-pathfinder');
module.exports = {
  name: 'building',
  tasks: ['build'],
  async execute(task, { bot, human, memory }) {
    const material = bot.inventory.items().find((item) => /_planks$|cobblestone/.test(item.name));
    if (!material || material.count < 16) throw new Error('Butuh minimal 16 plank/cobblestone untuk shelter');
    const origin = bot.entity.position.floored().offset(2, -1, 2);
    const outline = [];
    for (let y = 1; y <= 2; y++) {
      for (let x = 0; x < 5; x++) for (const z of [0, 4]) outline.push(new Vec3(x, y, z));
      for (let z = 1; z < 4; z++) for (const x of [0, 4]) outline.push(new Vec3(x, y, z));
    }
    for (const offset of outline.slice(0, material.count)) {
      const position = origin.plus(offset);
      if (bot.blockAt(position).name !== 'air') continue;
      const below = bot.blockAt(position.offset(0, -1, 0));
      if (!below || below.name === 'air') continue;
      await bot.pathfinder.goto(new GoalNear(position.x, position.y, position.z, 3));
      await bot.equip(material, 'hand');
      await human.delay(0.35);
      await bot.placeBlock(below, new Vec3(0, 1, 0));
    }
    memory.location('base', { x: origin.x + 2, y: origin.y + 1, z: origin.z + 2 }, bot.game.dimension);
    return 'membangun shelter dan mencatat base';
  }
};
