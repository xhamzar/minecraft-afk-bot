const { extractJson, validateDecision } = require('./reasoning');
const { ruleDecision } = require('./decision-maker');
const SYSTEM = `You are the safe planner for a Minecraft survival bot. Return exactly one JSON object:
{"task":"eat|escape|sleep|combat|explore|mine|craft|build|farm|hunt|store|idle","priority":0-100,"reason":"short Indonesian explanation","target":"optional block/item","parameters":{}}
Prioritize survival, never grief, never attack players, and choose only feasible actions from the world snapshot.`;
class Planner {
  constructor(router, memory, logger) { this.router = router; this.memory = memory; this.logger = logger; }
  async plan(world, goal) {
    let decision;
    let source = 'rules';
    try {
      const response = await this.router.ask([
        { role: 'system', content: SYSTEM },
        { role: 'user', content: JSON.stringify({ goal: goal || null, world, knowledge: this.knowledge() }) }
      ]);
      decision = validateDecision(extractJson(response.text));
      source = response.provider;
    } catch (error) {
      decision = ruleDecision(world);
      if (decision.task === 'explore') {
        const cached = this.memory.snapshot().decisions.slice(-1)[0];
        const fresh = cached && Date.now() - new Date(cached.at).getTime() < 10 * 60 * 1000;
        if (fresh && ['explore', 'mine', 'farm', 'hunt'].includes(cached.task)) {
          decision = { task: cached.task, target: cached.target, priority: 35, reason: 'Menggunakan keputusan aman yang tersimpan' };
          source = 'cache';
        }
      }
      this.logger.info('Using deterministic fallback planner', { reason: error.code || error.message });
    }
    const output = { ...decision, source };
    this.memory.decision(output);
    return output;
  }
  knowledge() {
    const state = this.memory.snapshot();
    return { locations: state.locations, experiences: state.experiences.slice(-12), recent: state.shortTerm.slice(-12) };
  }
}
module.exports = { Planner };
