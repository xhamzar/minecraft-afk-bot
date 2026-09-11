const HOSTILES = new Set(['zombie', 'skeleton', 'creeper', 'spider', 'witch', 'drowned', 'husk', 'phantom', 'pillager', 'enderman']);
const FOODS = /bread|apple|beef|porkchop|chicken|mutton|rabbit|potato|carrot|melon|cookie|stew|cod|salmon/;
class WorldSensor {
  constructor(bot) { this.bot = bot; this.recentDamage = false; }
  markDamage() { this.recentDamage = true; setTimeout(() => { this.recentDamage = false; }, 10000); }
  scan() {
    const bot = this.bot;
    const items = bot.inventory.items();
    const hostiles = Object.values(bot.entities)
      .filter((entity) => entity !== bot.entity && HOSTILES.has(entity.name) && entity.position.distanceTo(bot.entity.position) < 16)
      .map((entity) => ({ name: entity.name, distance: Math.round(entity.position.distanceTo(bot.entity.position)) }));
    const position = bot.entity.position;
    return {
      health: bot.health, hunger: bot.food, oxygen: bot.oxygenLevel,
      position: { x: Math.floor(position.x), y: Math.floor(position.y), z: Math.floor(position.z) },
      dimension: bot.game.dimension, isNight: bot.time.timeOfDay >= 12500 && bot.time.timeOfDay <= 23500,
      weather: bot.isRaining ? 'rain' : 'clear', hostiles,
      inventory: items.map((item) => ({ name: item.name, count: item.count })),
      inventoryFree: 36 - items.length, hasFood: items.some((item) => FOODS.test(item.name)),
      hasWood: items.some((item) => /log|planks/.test(item.name)), recentDamage: this.recentDamage
    };
  }
}
module.exports = { WorldSensor, HOSTILES, FOODS };
