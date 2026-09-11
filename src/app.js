// Vercel-compatible, read-only dashboard entry point.
// The autonomous Minecraft process must run with `npm start` on a persistent host.
const { createRuntime } = require('./index');

module.exports = createRuntime({ serverless: true }).app;
