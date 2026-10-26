import { killTweens } from '../shared/animations.js';

const routes = {};
let currentRoute = null;
let onNavigateCallback = null;
let cleanupFns = [];

export function registerCleanup(fn) {
  if (typeof fn === 'function') cleanupFns.push(fn);
}

export function register(name, renderFn) {
  routes[name] = renderFn;
}

export function navigate(route, params = {}) {
  if (!routes[route]) {
    console.warn(`Route "${route}" not registered.`);
    return;
  }
  currentRoute = route;
  history.pushState({ route, params }, '', `#${route}`);
  _render(route, params);
}

export function getCurrentRoute() { return currentRoute; }

export function onNavigate(cb) { onNavigateCallback = cb; }

function _render(route, params = {}) {
  const container = document.getElementById('view-container');
  if (!container) return;

  // Run all active view cleanups
  cleanupFns.forEach(fn => {
    try { fn(); } catch (_) {}
  });
  cleanupFns = [];
  killTweens(container);

  container.innerHTML = '';
  routes[route](container, params);
  if (onNavigateCallback) onNavigateCallback(route, params);

  // Update nav active state
  document.querySelectorAll('.nav-item').forEach(el => {
    el.classList.toggle('active', el.dataset.route === route);
  });

  // Update breadcrumb
  const navItem = document.querySelector(`.nav-item[data-route="${route}"]`);
  const label = navItem?.querySelector('span')?.textContent || route;
  const bc = document.getElementById('breadcrumb-current');
  if (bc) bc.textContent = label;

  // Scroll to top
  window.scrollTo(0, 0);
}

export function parseHash() {
  const raw = window.location.hash.replace(/^#\/?/, '').trim();
  if (!raw) return { route: 'overview', params: {} };
  const [routePart, queryPart] = raw.split('?');
  const route = routePart.replace(/\/+$/, '');
  const params = {};
  if (queryPart) {
    const searchParams = new URLSearchParams(queryPart);
    for (const [k, v] of searchParams.entries()) {
      params[k] = v;
    }
  }
  return { route: routes[route] ? route : 'overview', params };
}

export function initRouter() {
  const handleRouting = (e) => {
    const parsed = parseHash();
    const route = e?.state?.route || parsed.route;
    const params = e?.state?.params || parsed.params;
    currentRoute = route;
    _render(route, params);
  };

  // Handle back/forward and hash navigation
  window.addEventListener('popstate', handleRouting);
  window.addEventListener('hashchange', handleRouting);

  // Initial route from hash
  const initial = parseHash();
  currentRoute = initial.route;
  _render(initial.route, initial.params);
}
