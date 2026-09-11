const { OpenAICompatibleProvider } = require('./provider');
class HuggingFaceProvider extends OpenAICompatibleProvider {
  constructor(config, timeout) {
    super({ base_url: 'https://router.huggingface.co/v1', ...config }, timeout);
  }
}
module.exports = { HuggingFaceProvider };
