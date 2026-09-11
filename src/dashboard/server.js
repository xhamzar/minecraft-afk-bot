const express = require('express');
const path = require('node:path');
const { secureEqual } = require('../security/secrets');

function createDashboardApp(controller, memory, router, config, options = {}) {
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '16kb' }));
  app.use(express.static(path.join(__dirname, 'public')));
  app.use('/api', (request, response, next) => {
    if (!config.token && ['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(request.ip)) return next();
    const supplied = request.get('authorization')?.replace(/^Bearer\s+/i, '') || request.get('x-dashboard-token') || '';
    if (config.token && secureEqual(supplied, config.token)) return next();
    response.status(401).json({ error: 'Unauthorized' });
  });
  app.get('/api/status', (request, response) => response.json(controller.status()));
  app.get('/api/memory', (request, response) => response.json(memory.snapshot()));
  app.use('/api', (request, response, next) => {
    if (options.readOnly && request.method !== 'GET') {
      return response.status(503).json({ error: 'Bot controls require the persistent Node.js runtime' });
    }
    next();
  });
  app.post('/api/bot/start', (request, response) => { controller.start(); response.status(202).json({ ok: true }); });
  app.post('/api/bot/stop', (request, response) => { controller.stop(); response.json({ ok: true }); });
  app.post('/api/chat', (request, response) => {
    try { response.status(202).json({ ok: true, task: controller.submitGoal(request.body?.message) }); }
    catch (error) { response.status(400).json({ error: error.message }); }
  });
  app.post('/api/providers/select', (request, response) => {
    try { router.prefer(String(request.body?.name || '')); response.json({ ok: true }); }
    catch (error) { response.status(400).json({ error: error.message }); }
  });
  app.use('/api', (request, response) => response.status(404).json({ error: 'Not found' }));
  return app;
}

function createDashboard(controller, memory, router, config, logger) {
  const app = createDashboardApp(controller, memory, router, config);
  const server = app.listen(config.port, config.host, () => logger.info('Dashboard ready', { host: config.host, port: config.port }));
  return { app, server };
}
module.exports = { createDashboard, createDashboardApp };
