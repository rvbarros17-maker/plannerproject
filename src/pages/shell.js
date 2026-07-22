import { MESES, state } from '../state.js';
import { renderRoute, setOutlet, navigate, currentPath } from '../router.js';
import { signOut } from '../auth.js';
import { supabase } from '../supabaseClient.js';

const NAV_ITEMS = [
  { path: '/inicio', label: 'Início', icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/></svg>' },
  { path: '/diario', label: 'Diário', icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>' },
  { path: '/habitos', label: 'Hábitos & Saúde', icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 1 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z"/></svg>' },
  { path: '/metas', label: 'Metas', icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/></svg>' },
  { path: '/financas', label: 'Finanças', icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>' },
  { path: '/leituras', label: 'Leituras', icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 4.5A2.5 2.5 0 0 1 4.5 2H9a4 4 0 0 1 3 1.3A4 4 0 0 1 15 2h4.5A2.5 2.5 0 0 1 22 4.5v13A2.5 2.5 0 0 1 19.5 20H15a3 3 0 0 0-3 1.3A3 3 0 0 0 9 20H4.5A2.5 2.5 0 0 1 2 17.5Z"/><path d="M12 3.3V21.3"/></svg>' }
];

export function renderShell(root) {
  root.innerHTML = `
    <div class="app">
      <div class="sidebar">
        <div class="brand">Meu Planner<span>CADERNO VIVO — SEM LIMITE DE PÁGINA</span></div>
        <nav id="navTabs"></nav>
        <div class="sidebar-footer">
          <div class="profile-email">${state.user?.email || ''}</div>
          <button class="btn small" id="changePwdBtn">Alterar senha</button>
          <button class="btn small" id="logoutBtn">Sair</button>
        </div>
      </div>
      <div class="page" id="outlet"></div>
      <div class="ribbon-track" id="ribbonTrack"></div>
      <div class="ribbon-flag" id="ribbonFlag"></div>
      <div id="pwdModalRoot"></div>
    </div>
  `;

  const navEl = root.querySelector('#navTabs');
  NAV_ITEMS.forEach((item) => {
    const tab = document.createElement('div');
    tab.className = 'nav-tab';
    tab.dataset.path = item.path;
    tab.innerHTML = `<span class="icon">${item.icon}</span>${item.label}`;
    tab.onclick = () => navigate(item.path);
    navEl.appendChild(tab);
  });

  root.querySelector('#logoutBtn').onclick = async () => {
    await signOut();
    location.reload();
  };

  root.querySelector('#changePwdBtn').onclick = () => openPasswordModal(root);

  setOutlet(root.querySelector('#outlet'));
  buildRibbon(root);
  highlightActiveTab();
  window.addEventListener('hashchange', highlightActiveTab);

  renderRoute();
}

function highlightActiveTab() {
  const path = currentPath();
  document.querySelectorAll('.nav-tab').forEach((t) => {
    t.classList.toggle('active', t.dataset.path === path);
  });
}

function buildRibbon(root) {
  const track = root.querySelector('#ribbonTrack');
  track.innerHTML = '';
  MESES.forEach((mes, i) => {
    const dot = document.createElement('div');
    dot.className = 'ribbon-dot' + (i === state.month ? ' active' : '');
    dot.textContent = mes.substring(0, 3).toUpperCase();
    dot.title = mes;
    dot.onclick = () => {
      state.month = i;
      buildRibbon(root);
      renderRoute();
    };
    track.appendChild(dot);
  });
  positionRibbon(root);
}

function positionRibbon(root) {
  root.querySelectorAll('.ribbon-dot').forEach((d, i) => d.classList.toggle('active', i === state.month));
  const flag = root.querySelector('#ribbonFlag');
  const dotHeight = 32;
  flag.style.top = (20 + state.month * dotHeight + 3) + 'px';
}

function openPasswordModal(root) {
  const modalRoot = root.querySelector('#pwdModalRoot');
  modalRoot.innerHTML = `
    <div class="modal-backdrop">
      <div class="modal-card">
        <div class="card-title">Alterar senha</div>
        <label>Nova senha</label>
        <input type="password" id="newPwd" placeholder="Mínimo 6 caracteres">
        <label>Confirmar nova senha</label>
        <input type="password" id="newPwd2" placeholder="Repita a senha">
        <div class="login-actions" style="margin-top:20px">
          <button class="btn" id="savePwd">Salvar</button>
          <button class="btn small" id="cancelPwd">Cancelar</button>
        </div>
        <div id="pwdMsg" class="login-msg"></div>
      </div>
    </div>
  `;
  modalRoot.querySelector('#cancelPwd').onclick = () => { modalRoot.innerHTML = ''; };
  modalRoot.querySelector('#savePwd').onclick = async () => {
    const msg = modalRoot.querySelector('#pwdMsg');
    const p1 = modalRoot.querySelector('#newPwd').value;
    const p2 = modalRoot.querySelector('#newPwd2').value;
    if (p1.length < 6) { msg.textContent = 'A senha precisa ter pelo menos 6 caracteres.'; return; }
    if (p1 !== p2) { msg.textContent = 'As senhas não coincidem.'; return; }
    msg.textContent = 'Salvando…';
    const { error } = await supabase.auth.updateUser({ password: p1 });
    if (error) { msg.textContent = 'Erro: ' + error.message; return; }
    msg.textContent = 'Senha alterada com sucesso!';
    setTimeout(() => { modalRoot.innerHTML = ''; }, 1200);
  };
}
