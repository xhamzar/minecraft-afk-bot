const { AIProvider } = require('./provider');
class ClaudeProvider extends AIProvider {
  async ask(messages) {
    const system = messages.find((message) => message.role === 'system')?.content || '';
    const json = await this.request('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': this.config.api_key, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: this.config.model, max_tokens: 500, system, messages: messages.filter((message) => message.role !== 'system') })
    });
    return { text: json.content?.map((part) => part.text || '').join('') || '', usage: json.usage || {} };
  }
}
module.exports = { ClaudeProvider };
