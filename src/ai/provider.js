class ProviderError extends Error {
  constructor(message, options = {}) {
    super(message, options);
    this.name = 'ProviderError';
    this.retryable = options.retryable ?? true;
    this.status = options.status;
  }
}
class AIProvider {
  constructor(config, timeoutMs = 20000) { this.config = config; this.name = config.name; this.timeoutMs = timeoutMs; }
  async request(url, options) {
    let response;
    try { response = await fetch(url, { ...options, signal: AbortSignal.timeout(this.timeoutMs) }); }
    catch (error) {
      throw new ProviderError(`${this.name}: ${error.name === 'TimeoutError' ? 'timeout' : 'network error'}`, { cause: error });
    }
    if (!response.ok) {
      const body = (await response.text()).slice(0, 300);
      throw new ProviderError(`${this.name}: HTTP ${response.status} ${body}`, {
        status: response.status, retryable: response.status === 408 || response.status === 429 || response.status >= 500
      });
    }
    return response.json();
  }
}
class OpenAICompatibleProvider extends AIProvider {
  async ask(messages) {
    const base = this.config.base_url.replace(/\/$/, '');
    const json = await this.request(`${base}/chat/completions`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...(this.config.api_key ? { authorization: `Bearer ${this.config.api_key}` } : {}) },
      body: JSON.stringify({
        model: this.config.model, messages, temperature: 0.2,
        ...(this.config.json_mode ? { response_format: { type: 'json_object' } } : {})
      })
    });
    return { text: json.choices?.[0]?.message?.content || '', usage: json.usage || {} };
  }
}
module.exports = { AIProvider, OpenAICompatibleProvider, ProviderError };
