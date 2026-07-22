const routes = {};
let outlet = null;

export function registerRoute(path, renderFn) {
  routes[path] = renderFn;
}

export function setOutlet(el) {
  outlet = el;
}

export function currentPath() {
  return location.hash.replace('#', '') || '/inicio';
}

export async function renderRoute() {
  if (!outlet) return;
  const path = currentPath();
  const renderFn = routes[path] || routes['/inicio'];
  outlet.innerHTML = '<div class="loading">Carregando…</div>';
  await renderFn(outlet);
}

export function initRouter() {
  window.addEventListener('hashchange', renderRoute);
}

export function navigate(path) {
  location.hash = path;
}
