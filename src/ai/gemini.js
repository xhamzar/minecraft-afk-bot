const { AIProvider } = require('./provider');
class GeminiProvider extends AIProvider {
  async ask(messages) {
    const prompt = messages.map((message) => `${message.role.toUpperCase()}: ${message.content}`).join('\n');
    const model = encodeURIComponent(this.config.model);
    const json = await this.request(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: 'POST', headers: { 'content-type': 'application/json', 'x-goog-api-key': this.config.api_key },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { responseMimeType: 'application/json', temperature: 0.2 } })
    });
    return { text: json.candidates?.[0]?.content?.parts?.map((part) => part.text || '').join('') || '', usage: json.usageMetadata || {} };
  }
}
module.exports = { GeminiProvider };
