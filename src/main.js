import { getSession, onAuthChange } from './auth.js';
import { renderLogin } from './pages/login.js';
import { renderShell } from './pages/shell.js';
import { registerRoute, initRouter } from './router.js';
import { state } from './state.js';
import { renderInicio } from './pages/inicio.js';
import { renderDiario } from './pages/diario.js';
import { renderHabitos } from './pages/habitos.js';
import { renderMetas } from './pages/metas.js';
import { renderFinancas } from './pages/financas.js';
import { renderLeituras } from './pages/leituras.js';

const root = document.getElementById('app');

registerRoute('/inicio', renderInicio);
registerRoute('/diario', renderDiario);
registerRoute('/habitos', renderHabitos);
registerRoute('/metas', renderMetas);
registerRoute('/financas', renderFinancas);
registerRoute('/leituras', renderLeituras);
initRouter();

function boot(session) {
  if (!session) {
    renderLogin(root, (newSession) => { state.user = newSession.user; renderShell(root); });
    return;
  }
  state.user = session.user;
  renderShell(root);
}

getSession().then(boot);

onAuthChange((session) => {
  if (!session) { state.user = null; boot(null); }
});
