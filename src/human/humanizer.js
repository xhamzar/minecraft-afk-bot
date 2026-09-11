const { Vec3 } = require('vec3');
class Humanizer {
  constructor(bot, config) { this.bot = bot; this.config = config; }
  delay(multiplier = 1) {
    const min = this.config.minDelayMs;
    const duration = (min + Math.random() * (this.config.maxDelayMs - min)) * multiplier;
    return new Promise((resolve) => setTimeout(resolve, duration));
  }
  async lookAt(position) {
    const jitter = () => (Math.random() - 0.5) * 0.12;
    if (Math.random() < this.config.mistakeChance) {
      await this.naturalIdle();
      await this.delay(0.4);
    }
    await this.bot.lookAt(position.plus(new Vec3(jitter(), jitter(), jitter())), false);
    await this.delay(0.5);
  }
  async naturalIdle() {
    if (!this.bot.entity) return;
    const yaw = this.bot.entity.yaw + (Math.random() - 0.5) * 0.7;
    const pitch = Math.max(-1, Math.min(1, this.bot.entity.pitch + (Math.random() - 0.5) * 0.25));
    await this.bot.look(yaw, pitch, false);
  }
}
module.exports = { Humanizer };
