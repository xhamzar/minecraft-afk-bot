const { goals: { GoalNear } } = require('mineflayer-pathfinder');
const SAFE_TARGETS = new Set(['oak_log', 'birch_log', 'spruce_log', 'jungle_log', 'acacia_log', 'dark_oak_log', 'mangrove_log', 'stone', 'cobblestone', 'coal_ore', 'iron_ore', 'deepslate_iron_ore', 'diamond_ore', 'deepslate_diamond_ore']);
module.exports = {
  name: 'mining',
  tasks: ['mine', 'craft'],
  async execute(task, { bot, human }) {
    if (task.task === 'craft') {
      const item = bot.registry.itemsByName[task.target || 'crafting_table'];
      if (!item) throw new Error(`Item crafting tidak dikenal: ${task.target}`);
      const tableId = bot.registry.blocksByName.crafting_table?.id;
      const table = tableId == null ? null : bot.findBlock({ matching: tableId, maxDistance: 4 });
      const recipe = bot.recipesFor(item.id, null, 1, table)[0];
      if (!recipe) throw new Error(`Bahan crafting tidak cukup: ${item.name}`);
      await human.delay();
      await bot.craft(recipe, 1, table);
      return `craft ${item.name}`;
    }
    const target = SAFE_TARGETS.has(task.target) ? task.target : 'oak_log';
    const blockType = bot.registry.blocksByName[target];
    if (!blockType) throw new Error(`Block tidak tersedia di versi ini: ${target}`);
    const block = bot.findBlock({ matching: blockType.id, maxDistance: 48 });
    if (!block) throw new Error(`Tidak menemukan ${target}`);
    await bot.pathfinder.goto(new GoalNear(block.position.x, block.position.y, block.position.z, 1));
    if (!bot.canDigBlock(block)) throw new Error(`Tidak dapat menambang ${target}`);
    await human.lookAt(block.position.offset(0.5, 0.5, 0.5));
    await bot.dig(block);
    return `menambang ${target}`;
  }
};
