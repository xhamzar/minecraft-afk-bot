const fs = require('node:fs');
const path = require('node:path');
class PluginLoader {
  constructor(directory, context, logger) {
    this.directory = directory;
    this.context = context;
    this.logger = logger;
    this.tasks = new Map();
    this.plugins = [];
  }
  load() {
    for (const file of fs.readdirSync(this.directory).filter((name) => name.endsWith('.js') && name !== 'plugin-loader.js')) {
      const plugin = require(path.join(this.directory, file));
      if (!plugin.name || !Array.isArray(plugin.tasks) || typeof plugin.execute !== 'function') {
        this.logger.warn('Ignoring invalid plugin', { file });
        continue;
      }
      for (const task of plugin.tasks) {
        if (this.tasks.has(task)) throw new Error(`Duplicate plugin task: ${task}`);
        this.tasks.set(task, plugin);
      }
      plugin.setup?.(this.context);
      this.plugins.push({ name: plugin.name, tasks: plugin.tasks });
    }
    return this.plugins;
  }
  async execute(task) {
    const plugin = this.tasks.get(task.task);
    if (!plugin) throw new Error(`No plugin can execute task: ${task.task}`);
    return plugin.execute(task, this.context);
  }
}
module.exports = { PluginLoader };
