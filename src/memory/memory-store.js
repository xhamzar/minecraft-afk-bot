const { JsonDatabase } = require('../database/json-database');
class MemoryStore {
  constructor(file) {
    this.db = new JsonDatabase(file, { shortTerm: [], locations: {}, players: {}, experiences: [], decisions: [], providerStats: {} });
  }
  remember(event, data = {}) {
    this.db.update((state) => {
      state.shortTerm.push({ at: new Date().toISOString(), event, data });
      state.shortTerm = state.shortTerm.slice(-100);
    });
  }
  location(name, position, dimension = 'unknown') {
    this.db.update((state) => {
      state.locations[name] = { ...position, dimension, updatedAt: new Date().toISOString() };
      const entries = Object.entries(state.locations);
      if (entries.length > 500) {
        entries.sort((a, b) => new Date(a[1].updatedAt) - new Date(b[1].updatedAt));
        for (const [oldName] of entries.slice(0, entries.length - 500)) delete state.locations[oldName];
      }
    });
  }
  experience(event, lesson, outcome = 'unknown') {
    this.db.update((state) => {
      state.experiences.push({ at: new Date().toISOString(), event, lesson, outcome });
      state.experiences = state.experiences.slice(-500);
    });
  }
  decision(value) {
    this.db.update((state) => {
      state.decisions.push({ at: new Date().toISOString(), ...value });
      state.decisions = state.decisions.slice(-100);
    });
  }
  snapshot() { return structuredClone(this.db.data); }
}
module.exports = { MemoryStore };
