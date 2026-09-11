class EmotionSystem {
  constructor() { this.state = { fear: 0, curiosity: 0.5, confidence: 0.5, fatigue: 0 }; }
  update(world) {
    this.state.fear = Math.min(1, world.hostiles.length * 0.25 + (world.health < 8 ? 0.5 : 0));
    this.state.curiosity = Math.max(0.1, Math.min(1, this.state.curiosity + (world.recentDamage ? -0.2 : 0.02)));
    this.state.fatigue = Math.min(1, this.state.fatigue + 0.01);
    return { ...this.state };
  }
  rested() { this.state.fatigue = 0; }
}
module.exports = { EmotionSystem };
