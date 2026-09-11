class AIRouter {
  constructor(manager, memory, logger, config) {
    this.manager = manager;
    this.memory = memory;
    this.logger = logger;
    this.cooldownMs = config.cooldown_ms || 60000;
    this.stats = memory.db.get('providerStats', {});
    this.preferred = null;
  }
  stat(name) {
    const today = new Date().toISOString().slice(0, 10);
    const stat = this.stats[name] ||= { requests: 0, failures: 0, tokens: 0, cooldownUntil: 0, lastError: null, period: today };
    if (stat.period !== today) Object.assign(stat, { requests: 0, tokens: 0, cooldownUntil: 0, period: today });
    return stat;
  }
  async ask(messages) {
    const errors = [];
    const providers = [...this.manager.list()].sort((a, b) =>
      (a.config.name === this.preferred ? -1 : 0) - (b.config.name === this.preferred ? -1 : 0));
    for (const entry of providers) {
      const stat = this.stat(entry.config.name);
      if (stat.cooldownUntil > Date.now() || (entry.config.limit > 0 && stat.requests >= entry.config.limit)) continue;
      if (!entry.config.api_key && !['ollama', 'lmstudio', 'llamacpp'].includes(entry.config.name)) continue;
      try {
        stat.requests++;
        const result = await entry.client.ask(messages);
        stat.lastSuccess = new Date().toISOString();
        stat.tokens += result.usage.total_tokens != null
          ? Number(result.usage.total_tokens)
          : Number(result.usage.input_tokens || result.usage.prompt_tokens || result.usage.promptTokenCount || 0)
            + Number(result.usage.output_tokens || result.usage.completion_tokens || result.usage.candidatesTokenCount || 0);
        this.memory.db.set('providerStats', this.stats);
        return { ...result, provider: entry.config.name };
      } catch (error) {
        stat.failures++;
        stat.lastError = { at: new Date().toISOString(), message: String(error.message).slice(0, 300), status: error.status };
        stat.cooldownUntil = Date.now() + this.cooldownMs;
        errors.push(`${entry.config.name}: ${error.message}`);
        this.logger.warn('AI provider failed; trying next provider', { provider: entry.config.name, status: error.status });
        this.memory.db.set('providerStats', this.stats);
      }
    }
    const error = new Error(errors.length ? `No AI provider available (${errors.join('; ')})` : 'No enabled AI provider available');
    error.code = 'AI_UNAVAILABLE';
    throw error;
  }
  async askAI(prompt, system = 'Respond with valid JSON.') {
    return this.ask([{ role: 'system', content: system }, { role: 'user', content: String(prompt) }]);
  }
  prefer(name) {
    if (!name) { this.preferred = null; return; }
    if (!this.manager.list().some((entry) => entry.config.name === name)) throw new Error('Provider is not enabled');
    this.preferred = name;
  }
  providers() {
    return this.manager.list().map(({ config }) => ({ name: config.name, model: config.model, priority: config.priority }));
  }
  status() { return structuredClone(this.stats); }
}
module.exports = { AIRouter };
