const { loadConfig } = require('./config');
const { Logger } = require('./utils/logger');
const { MemoryStore } = require('./memory/memory-store');
const { ProviderManager } = require('./ai/provider-manager');
const { AIRouter } = require('./ai/router');
const { Planner } = require('./brain/planner');
const { BotController } = require('./bot');
const { createDashboard } = require('./dashboard/server');

function main() {
  const config = loadConfig();
  const logger = new Logger(config.bot.logPath);
  const memory = new MemoryStore(config.bot.memoryPath);
  const manager = new ProviderManager(config.ai);
  const router = new AIRouter(manager, memory, logger, config.ai);
  const planner = new Planner(router, memory, logger);
  const controller = new BotController(config.bot, planner, memory, router, logger);
  const dashboard = createDashboard(controller, memory, router, config.bot.dashboard, logger);
  if (config.bot.autostart) controller.start();
  const shutdown = () => {
    controller.stop();
    dashboard.server.close(() => process.exit(0));
    setTimeout(() => process.exit(1), 5000).unref();
  };
  process.once('SIGINT', shutdown);
  process.once('SIGTERM', shutdown);
  return { controller, dashboard, memory, router };
}

if (require.main === module) main();
module.exports = { main };
