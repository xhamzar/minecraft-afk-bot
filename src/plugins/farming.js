const { goals: { GoalNear } } = require('mineflayer-pathfinder');
const { Vec3 } = require('vec3');
module.exports = {
  name: 'farming',
  tasks: ['farm'],
  async execute(task, { bot, human }) {
    const crop = bot.findBlock({
      matching: (block) => ['wheat', 'carrots', 'potatoes'].includes(block.name) && block.metadata >= 7
        || block.name === 'beetroots' && block.metadata >= 3,
      maxDistance: 32
    });
    if (!crop) throw new Error('Tanaman matang tidak ditemukan');
    await bot.pathfinder.goto(new GoalNear(crop.position.x, crop.position.y, crop.position.z, 1));
    await human.lookAt(crop.position);
    await bot.dig(crop);
    const seedNames = { wheat: 'wheat_seeds', carrots: 'carrot', potatoes: 'potato', beetroots: 'beetroot_seeds' };
    const seed = bot.inventory.items().find((item) => item.name === seedNames[crop.name]);
    const soil = bot.blockAt(crop.position.offset(0, -1, 0));
    if (seed && soil) {
      await bot.equip(seed, 'hand');
      await bot.placeBlock(soil, new Vec3(0, 1, 0));
    }
    return `memanen ${crop.name}`;
  }
};
