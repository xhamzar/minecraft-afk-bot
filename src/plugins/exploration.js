const { goals: { GoalNear } } = require('mineflayer-pathfinder');
module.exports = {
  name: 'exploration',
  tasks: ['explore'],
  async execute(task, { bot, human, memory }) {
    const angle = Math.random() * Math.PI * 2;
    const distance = 12 + Math.random() * 18;
    const target = bot.entity.position.offset(Math.cos(angle) * distance, 0, Math.sin(angle) * distance);
    await human.delay();
    await bot.pathfinder.goto(new GoalNear(Math.floor(target.x), Math.floor(target.y), Math.floor(target.z), 2));
    const position = bot.entity.position;
    memory.location(`explored-${Date.now()}`, { x: Math.floor(position.x), y: Math.floor(position.y), z: Math.floor(position.z) }, bot.game.dimension);
    return 'menjelajahi area baru';
  }
};
