class TaskQueue {
  constructor() { this.items = []; this.active = null; }
  add(task) {
    const item = { id: crypto.randomUUID(), createdAt: new Date().toISOString(), priority: 50, ...task };
    this.items.push(item);
    this.items.sort((a, b) => b.priority - a.priority);
    return item;
  }
  next() { this.active = this.items.shift() || null; return this.active; }
  finish() { const previous = this.active; this.active = null; return previous; }
  clear() { this.items = []; }
  snapshot() { return { active: this.active, queued: [...this.items] }; }
}
module.exports = { TaskQueue };
