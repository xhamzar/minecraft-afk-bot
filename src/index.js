const { loadConfig } = require('./config');
const { Logger } = require('./utils/logger');
const { MemoryStore } = require('./memory/memory-store');
const { ProviderManager } = require('./ai/provider-manager');
const { AIRouter } = require('./ai/router');
const { Planner } = require('./brain/planner');
const { BotController } = require('./bot');
const { createDashboardApp } = require('./dashboard/server');

function createRuntime({ serverless = false } = {}) {
  const config = loadConfig();
  if (serverless) {
    config.bot.memoryPath = '/tmp/minecraft-ai-bot/memory.json';
    config.bot.logPath = '/tmp/minecraft-ai-bot/bot.log';
    config.bot.autostart = false;
  }
  const logger = new Logger(config.bot.logPath);
  const memory = new MemoryStore(config.bot.memoryPath);
  const manager = new ProviderManager(config.ai);
  const router = new AIRouter(manager, memory, logger, config.ai);
  const planner = new Planner(router, memory, logger);
  const controller = new BotController(config.bot, planner, memory, router, logger);
  const app = createDashboardApp(controller, memory, router, config.bot.dashboard, { readOnly: serverless });
  return { app, config, controller, logger, memory, router };
}

function main() {
  const runtime = createRuntime();
  const { app, config, controller, logger } = runtime;
  const server = app.listen(config.bot.dashboard.port, config.bot.dashboard.host, () => {
    logger.info('Dashboard ready', { host: config.bot.dashboard.host, port: config.bot.dashboard.port });
  });
  if (config.bot.autostart) controller.start();
  const shutdown = () => {
    controller.stop();
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(1), 5000).unref();
  };
  process.once('SIGINT', shutdown);
  process.once('SIGTERM', shutdown);
  return { ...runtime, server };
}

if (require.main === module) main();
module.exports = { createRuntime, main };
