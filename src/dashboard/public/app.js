const byId = (id) => document.getElementById(id);
const token = byId('token');
token.value = sessionStorage.getItem('dashboardToken') || '';
token.addEventListener('change', () => sessionStorage.setItem('dashboardToken', token.value));

async function api(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    headers: { 'content-type': 'application/json', ...(token.value ? { authorization: `Bearer ${token.value}` } : {}), ...options.headers }
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || `HTTP ${response.status}`);
  return data;
}

function render(data) {
  byId('state').textContent = data.state;
  byId('state').className = `badge ${data.state}`;
  byId('health').textContent = data.health ?? '—';
  byId('hunger').textContent = data.hunger ?? '—';
  byId('position').textContent = data.position ? `${data.position.x}, ${data.position.y}, ${data.position.z}` : '—';
  byId('goal').textContent = data.goal || data.tasks.active?.reason || 'autonomous';
  const activity = byId('activity');
  activity.replaceChildren(...data.activity.slice().reverse().map((item) => {
    const li = document.createElement('li');
    const time = document.createElement('time');
    time.textContent = new Date(item.at).toLocaleTimeString();
    li.append(time, document.createTextNode(item.message));
    return li;
  }));
  const select = byId('provider');
  if (select.options.length !== data.availableProviders.length + 1) {
    select.replaceChildren(new Option('Automatic priority', ''), ...data.availableProviders.map((item) => new Option(`${item.name} · ${item.model}`, item.name)));
  }
  select.value = data.providerPreference || '';
  const usage = byId('usage');
  const entries = Object.entries(data.providers);
  usage.replaceChildren(...(entries.length ? entries.map(([name, stat]) => {
    const card = document.createElement('div');
    card.textContent = `${name}: ${stat.requests} request · ${stat.tokens} token · ${stat.failures} error`;
    return card;
  }) : [document.createTextNode('Belum ada provider aktif atau request AI.')]));
}

async function refresh() {
  try { render(await api('/api/status')); byId('error').textContent = ''; }
  catch (error) { byId('error').textContent = error.message; }
}
byId('start').onclick = () => api('/api/bot/start', { method: 'POST' }).then(refresh).catch(showError);
byId('stop').onclick = () => api('/api/bot/stop', { method: 'POST' }).then(refresh).catch(showError);
byId('provider').onchange = (event) => {
  api('/api/providers/select', { method: 'POST', body: JSON.stringify({ name: event.target.value }) }).then(refresh).catch(showError);
};
byId('chat').onsubmit = (event) => {
  event.preventDefault();
  api('/api/chat', { method: 'POST', body: JSON.stringify({ message: byId('message').value }) })
    .then(() => { byId('message').value = ''; refresh(); }).catch(showError);
};
function showError(error) { byId('error').textContent = error.message; }
refresh();
setInterval(refresh, 3000);
