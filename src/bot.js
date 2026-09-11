const EventEmitter = require('node:events');
const mineflayer = require('mineflayer');
const { pathfinder, Movements } = require('mineflayer-pathfinder');
const { PluginLoader } = require('./plugins/plugin-loader');
const { WorldSensor } = require('./brain/world-sensor');
const { TaskQueue } = require('./brain/task-queue');
const { ruleDecision } = require('./brain/decision-maker');
const { EmotionSystem } = require('./brain/emotion-system');
const { LearningSystem } = require('./brain/learning-system');
const { Humanizer } = require('./human/humanizer');
const { canCommand, parseGoal } = require('./security/permissions');

class BotController extends EventEmitter {
  constructor(config, planner, memory, router, logger) {
    super();
    this.config = config;
    this.planner = planner;
    this.memory = memory;
    this.router = router;
    this.logger = logger;
    this.queue = new TaskQueue();
    this.emotions = new EmotionSystem();
    this.learning = new LearningSystem(memory);
    this.state = 'stopped';
    this.desiredRunning = false;
    this.reconnects = 0;
    this.consecutiveFailures = 0;
    this.activity = [];
    this.busy = false;
    this.goal = null;
  }

  start() {
    if (this.desiredRunning) return;
    this.desiredRunning = true;
    this.connect();
  }

  connect() {
    this.state = 'connecting';
    this.emitActivity('Menghubungkan ke server');
    this.bot = mineflayer.createBot(this.config.server);
    this.bot.loadPlugin(pathfinder);
    this.bindEvents();
  }

  bindEvents() {
    const bot = this.bot;
    bot.once('spawn', () => {
      if (bot !== this.bot) return;
      bot.pathfinder.setMovements(new Movements(bot));
      this.sensor = new WorldSensor(bot);
      this.human = new Humanizer(bot, this.config.human);
      this.plugins = new PluginLoader(require('node:path').join(__dirname, 'plugins'), {
        bot, human: this.human, memory: this.memory, logger: this.logger
      }, this.logger);
      this.plugins.load();
      this.state = 'online';
      this.consecutiveFailures = 0;
      this.memory.location('last_spawn', this.position(), bot.game.dimension);
      this.emitActivity('Bot online');
      this.loop = setInterval(() => this.tick().catch((error) => this.logger.error('Decision loop error', { error: error.message })), this.config.decisionIntervalMs);
    });
    bot.on('health', () => {
      if (this.sensor && bot.health < 20) this.sensor.markDamage();
      if (bot.health <= 0) this.memory.experience('mati', 'Periksa penyebab kematian dan siapkan perlengkapan lebih baik', 'death');
    });
    bot.on('chat', (username, message) => {
      if (username === bot.username || !message.startsWith(this.config.chatPrefix)) return;
      if (!canCommand(username, this.config.owners)) {
        this.logger.warn('Chat command denied', { username });
        return;
      }
      try {
        const task = this.submitGoal(message.slice(this.config.chatPrefix.length));
        bot.chat(`Siap, tugas diterima: ${task.reason}`);
      } catch (error) { bot.chat(`Perintah ditolak: ${error.message}`); }
    });
    bot.on('kicked', (reason) => this.logger.warn('Bot kicked', { reason: String(reason).slice(0, 300) }));
    bot.on('error', (error) => this.logger.error('Minecraft connection error', { error: error.message }));
    bot.once('end', (reason) => this.onEnd(bot, reason));
  }

  onEnd(instance, reason) {
    if (instance !== this.bot) return;
    clearInterval(this.loop);
    this.busy = false;
    this.state = this.desiredRunning ? 'reconnecting' : 'stopped';
    this.emitActivity(`Koneksi berakhir: ${reason || 'unknown'}`);
    if (this.desiredRunning) {
      this.reconnects++;
      this.consecutiveFailures++;
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = setTimeout(() => this.connect(), Math.min(60000, 5000 * this.consecutiveFailures));
    }
  }

  stop() {
    this.desiredRunning = false;
    clearTimeout(this.reconnectTimer);
    clearInterval(this.loop);
    this.queue.clear();
    this.bot?.pathfinder?.stop();
    try { this.bot?.quit('Dashboard stop'); } catch {}
    this.state = 'stopped';
    this.emitActivity('Bot dihentikan');
  }

  submitGoal(text) {
    const parsed = parseGoal(text);
    this.goal = parsed.goal || parsed.reason;
    const task = parsed.task ? this.queue.add(parsed) : parsed;
    this.memory.remember('player_goal', { text: parsed.reason });
    this.emitActivity(`Goal baru: ${parsed.reason}`);
    return task;
  }

  async tick() {
    if (this.busy || this.state !== 'online' || !this.bot?.entity) return;
    this.busy = true;
    let task = this.queue.next();
    try {
      const world = this.sensor.scan();
      const emotion = this.emotions.update(world);
      const survival = ruleDecision(world);
      if (survival.priority >= 70 && survival.priority > (task?.priority || 0)) {
        task = survival;
      } else if (!task?.task) {
        task = await this.planner.plan({ ...world, emotion }, this.goal);
      }
      this.emitActivity(`${task.task}: ${task.reason}`);
      const result = await this.plugins.execute(task);
      this.learning.success(task.task, result);
      this.emitActivity(result);
      if (task.reason === this.goal) this.goal = null;
    } catch (error) {
      this.learning.failure(task?.task || 'unknown', error);
      this.logger.warn('Task failed', { task: task?.task || 'unknown', error: error.message });
      this.emitActivity(`Tugas gagal: ${error.message}`);
    } finally {
      this.queue.finish();
      this.busy = false;
    }
  }

  position() {
    const position = this.bot?.entity?.position;
    return position ? { x: Math.floor(position.x), y: Math.floor(position.y), z: Math.floor(position.z) } : null;
  }

  emitActivity(message) {
    const event = { at: new Date().toISOString(), message };
    this.activity.push(event);
    this.activity = this.activity.slice(-100);
    this.logger.info(message);
    this.emit('activity', event);
  }

  status() {
    return {
      state: this.state, desiredRunning: this.desiredRunning, reconnects: this.reconnects,
      username: this.config.server.username, server: `${this.config.server.host}:${this.config.server.port}`,
      health: this.bot?.health ?? null, hunger: this.bot?.food ?? null, position: this.position(),
      goal: this.goal, tasks: this.queue.snapshot(), providers: this.router.status(),
      availableProviders: this.router.providers(), providerPreference: this.router.preferred,
      plugins: this.plugins?.plugins || [], activity: this.activity.slice(-25)
    };
  }
}
module.exports = { BotController };
