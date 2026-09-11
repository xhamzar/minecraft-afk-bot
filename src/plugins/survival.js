const { goals: { GoalNear } } = require('mineflayer-pathfinder');
const FOOD = /bread|apple|beef|porkchop|chicken|mutton|rabbit|potato|carrot|melon|cookie|stew|cod|salmon/;
module.exports = {
  name: 'survival',
  tasks: ['eat', 'escape', 'sleep', 'store', 'idle'],
  async execute(task, { bot, human, memory }) {
    if (task.task === 'eat') {
      const food = bot.inventory.items().find((item) => FOOD.test(item.name));
      if (!food) throw new Error('Tidak ada makanan di inventory');
      await bot.equip(food, 'hand');
      await human.delay();
      await bot.consume();
      return `makan ${food.name}`;
    }
    if (task.task === 'escape') {
      const threats = Object.values(bot.entities).filter((entity) => entity.type === 'mob' && entity.position.distanceTo(bot.entity.position) < 12);
      const threat = threats.sort((a, b) => a.position.distanceTo(bot.entity.position) - b.position.distanceTo(bot.entity.position))[0];
      const away = threat ? bot.entity.position.minus(threat.position).scaled(12) : { x: 8, z: 8 };
      const target = bot.entity.position.offset(away.x, 0, away.z);
      await bot.pathfinder.goto(new GoalNear(Math.floor(target.x), Math.floor(target.y), Math.floor(target.z), 2));
      return 'menjauh dari bahaya';
    }
    if (task.task === 'sleep') {
      const bed = bot.findBlock({ matching: (block) => /bed$/.test(block.name), maxDistance: 24 });
      if (!bed) throw new Error('Tempat tidur tidak ditemukan; tetap berlindung');
      await bot.pathfinder.goto(new GoalNear(bed.position.x, bed.position.y, bed.position.z, 2));
      await bot.sleep(bed);
      return 'tidur';
    }
    if (task.task === 'store') {
      const base = memory.snapshot().locations.base;
      if (base) await bot.pathfinder.goto(new GoalNear(base.x, base.y, base.z, 2));
      const chestBlock = bot.findBlock({ matching: (block) => /chest$|barrel$/.test(block.name), maxDistance: 8 });
      if (!chestBlock) return base ? 'kembali ke base; chest belum tersedia' : 'inventory penuh dan base belum tercatat';
      const chest = await bot.openContainer(chestBlock);
      const protectedItems = /sword|pickaxe|axe|shovel|food|bread|apple|beef|porkchop|torch/;
      for (const item of bot.inventory.items().filter((entry) => !protectedItems.test(entry.name)).slice(0, 12)) {
        await chest.deposit(item.type, item.metadata, item.count);
      }
      chest.close();
      return 'menyimpan resource ke chest';
    }
    await human.naturalIdle();
    return 'menunggu';
  }
};
