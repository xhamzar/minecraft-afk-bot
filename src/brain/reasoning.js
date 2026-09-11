const ALLOWED_TASKS = new Set(['eat', 'escape', 'sleep', 'combat', 'explore', 'mine', 'craft', 'build', 'farm', 'hunt', 'store', 'idle']);
function extractJson(text) {
  const cleaned = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start < 0 || end <= start) throw new Error('AI response did not contain JSON');
  return JSON.parse(cleaned.slice(start, end + 1));
}
function validateDecision(input) {
  if (!input || !ALLOWED_TASKS.has(input.task)) throw new Error('AI selected an unsupported task');
  return {
    task: input.task,
    priority: Math.max(0, Math.min(100, Number(input.priority) || 50)),
    reason: String(input.reason || 'AI decision').slice(0, 180),
    target: typeof input.target === 'string' ? input.target.slice(0, 80) : undefined,
    parameters: input.parameters && typeof input.parameters === 'object' ? input.parameters : {}
  };
}
module.exports = { ALLOWED_TASKS, extractJson, validateDecision };
