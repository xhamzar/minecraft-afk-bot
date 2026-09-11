const { AIProvider } = require('./provider');
class OllamaProvider extends AIProvider {
  async ask(messages) {
    const json = await this.request(`${this.config.base_url.replace(/\/$/, '')}/api/chat`, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ model: this.config.model, messages, stream: false, format: 'json', options: { temperature: 0.2 } })
    });
    return { text: json.message?.content || '', usage: { prompt_tokens: json.prompt_eval_count, completion_tokens: json.eval_count } };
  }
}
module.exports = { OllamaProvider };
