const { OpenAICompatibleProvider } = require('./provider');
const { OpenAIProvider } = require('./openai');
const { ClaudeProvider } = require('./claude');
const { GeminiProvider } = require('./gemini');
const { OllamaProvider } = require('./ollama');
const { HuggingFaceProvider } = require('./huggingface');
const COMPATIBLE = {
  openrouter: 'https://openrouter.ai/api/v1', deepseek: 'https://api.deepseek.com/v1',
  mistral: 'https://api.mistral.ai/v1', lmstudio: 'http://127.0.0.1:1234/v1', llamacpp: 'http://127.0.0.1:8080/v1'
};
function createProvider(config, timeout) {
  if (config.name === 'openai') return new OpenAIProvider(config, timeout);
  if (config.name === 'anthropic') return new ClaudeProvider(config, timeout);
  if (config.name === 'gemini') return new GeminiProvider(config, timeout);
  if (config.name === 'ollama') return new OllamaProvider(config, timeout);
  if (config.name === 'huggingface') return new HuggingFaceProvider(config, timeout);
  if (COMPATIBLE[config.name]) return new OpenAICompatibleProvider({ base_url: COMPATIBLE[config.name], ...config }, timeout);
  throw new Error(`Unsupported AI provider: ${config.name}`);
}
class ProviderManager {
  constructor(config) {
    this.providers = config.providers.filter((provider) => provider.enabled).sort((a, b) => a.priority - b.priority)
      .map((provider) => ({ config: provider, client: createProvider(provider, config.timeout_ms) }));
  }
  list() { return this.providers; }
}
module.exports = { ProviderManager, createProvider };
