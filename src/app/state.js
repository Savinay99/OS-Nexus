/**
 * OS Nexus : Application State (LocalStorage-backed)
 */

const STATE_KEY = 'osnexus_state';

const defaultState = {
  theme: 'dark',
  recentRoutes: [],
  vfsFiles: [],
  simulatorState: {},
};

let state = { ...defaultState };

try {
  const saved = localStorage.getItem(STATE_KEY);
  if (saved) state = { ...defaultState, ...JSON.parse(saved) };
} catch (_) { /* ignore */ }

export function getState(key) {
  return key ? state[key] : { ...state };
}

export function setState(key, value) {
  state[key] = value;
  try { localStorage.setItem(STATE_KEY, JSON.stringify(state)); } catch (_) { /* ignore */ }
}

export function updateRecentRoutes(route) {
  const recent = state.recentRoutes.filter(r => r !== route);
  recent.unshift(route);
  setState('recentRoutes', recent.slice(0, 5));
}

export function resetState() {
  state = { ...defaultState };
  try { localStorage.removeItem(STATE_KEY); } catch (_) { /* ignore */ }
}
