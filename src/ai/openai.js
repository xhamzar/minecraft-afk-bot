const { OpenAICompatibleProvider } = require('./provider');
class OpenAIProvider extends OpenAICompatibleProvider {
  constructor(config, timeout) { super({ base_url: 'https://api.openai.com/v1', ...config }, timeout); }
}
module.exports = { OpenAIProvider };
