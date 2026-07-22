import { signIn, signUp } from '../auth.js';

export function renderLogin(root, onSuccess) {
  root.innerHTML = `
    <div class="login-screen">
      <div class="login-card">
        <div class="brand" style="color:var(--pine-dark)">Meu Planner<span style="color:var(--ink-soft)">CADERNO VIVO — SEM LIMITE DE PÁGINA</span></div>
        <form id="loginForm">
          <label>E-mail</label>
          <input type="email" id="email" required placeholder="voce@email.com">
          <label>Senha</label>
          <input type="password" id="password" required placeholder="••••••••">
          <div class="login-actions">
            <button type="submit" class="btn" id="submitBtn">Entrar</button>
            <button type="button" class="btn small" id="signupBtn">Criar conta</button>
          </div>
          <div id="loginMsg" class="login-msg"></div>
        </form>
      </div>
    </div>
  `;

  const msg = root.querySelector('#loginMsg');
  const form = root.querySelector('#loginForm');
  const emailEl = root.querySelector('#email');
  const passEl = root.querySelector('#password');

  form.onsubmit = async (e) => {
    e.preventDefault();
    msg.textContent = 'Entrando…';
    const { data, error } = await signIn(emailEl.value, passEl.value);
    if (error) { msg.textContent = 'Erro: ' + error.message; return; }
    onSuccess(data.session);
  };

  root.querySelector('#signupBtn').onclick = async () => {
    if (!emailEl.value || !passEl.value) { msg.textContent = 'Preencha e-mail e senha primeiro.'; return; }
    msg.textContent = 'Criando conta…';
    const { data, error } = await signUp(emailEl.value, passEl.value);
    if (error) { msg.textContent = 'Erro: ' + error.message; return; }
    if (data.session) { onSuccess(data.session); }
    else { msg.textContent = 'Conta criada! Verifique seu e-mail para confirmar, depois faça login.'; }
  };
}
