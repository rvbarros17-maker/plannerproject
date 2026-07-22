import { supabase } from '../supabaseClient.js';
import { state, MESES } from '../state.js';

export async function renderFinancas(container) {
  const mes = MESES[state.month];
  const { data: lancamentos } = await supabase
    .from('financas_lancamentos')
    .select('*')
    .eq('user_id', state.user.id)
    .eq('mes', state.month + 1)
    .eq('ano', state.year)
    .order('created_at');

  const rows = (lancamentos || []).map((l) => `
    <tr>
      <td><input type="text" value="${l.descricao || ''}" data-id="${l.id}" data-field="descricao" placeholder="Descrição"></td>
      <td>
        <select data-id="${l.id}" data-field="tipo">
          <option value="entrada" ${l.tipo === 'entrada' ? 'selected' : ''}>Entrou</option>
          <option value="gasto" ${l.tipo === 'gasto' ? 'selected' : ''}>Saiu</option>
          <option value="poupou" ${l.tipo === 'poupou' ? 'selected' : ''}>Poupou</option>
          <option value="guardou" ${l.tipo === 'guardou' ? 'selected' : ''}>Guardou</option>
        </select>
      </td>
      <td><input type="number" step="0.01" value="${l.valor}" data-id="${l.id}" data-field="valor" placeholder="0.00"></td>
      <td><button class="btn small delete-fin" data-id="${l.id}">×</button></td>
    </tr>`).join('');

  const entrou = (lancamentos || []).filter((l) => l.tipo === 'entrada').reduce((s, l) => s + Number(l.valor), 0);
  const saiu = (lancamentos || []).filter((l) => l.tipo === 'gasto').reduce((s, l) => s + Number(l.valor), 0);
  const saldo = entrou - saiu;

  container.innerHTML = `
    <div class="page-header">
      <div><h1 class="page-title">Finanças</h1><div class="page-sub">${mes.toUpperCase()} · ${state.year}</div></div>
    </div>
    <div class="card">
      <div class="card-title">Lançamentos de ${mes} <button class="btn small" id="addFin">+ Novo lançamento</button></div>
      <table class="fin-table">
        <thead><tr><th>Descrição</th><th>Tipo</th><th>Valor</th><th></th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <div style="margin-top:14px">Saldo do mês: <span class="fin-total">R$ ${saldo.toFixed(2)}</span></div>
    </div>
  `;

  container.querySelector('#addFin').onclick = async () => {
    await supabase.from('financas_lancamentos').insert({
      user_id: state.user.id, mes: state.month + 1, ano: state.year, descricao: '', valor: 0, tipo: 'gasto'
    });
    renderFinancas(container);
  };

  container.querySelectorAll('.fin-table input').forEach((inp) => {
    let timeout;
    inp.oninput = () => {
      clearTimeout(timeout);
      timeout = setTimeout(async () => {
        const value = inp.dataset.field === 'valor' ? parseFloat(inp.value || '0') : inp.value;
        await supabase.from('financas_lancamentos').update({ [inp.dataset.field]: value }).eq('id', inp.dataset.id);
      }, 600);
    };
  });

  container.querySelectorAll('.fin-table select').forEach((sel) => {
    sel.onchange = async () => {
      await supabase.from('financas_lancamentos').update({ tipo: sel.value }).eq('id', sel.dataset.id);
      renderFinancas(container);
    };
  });

  container.querySelectorAll('.delete-fin').forEach((btn) => {
    btn.onclick = async () => {
      await supabase.from('financas_lancamentos').delete().eq('id', btn.dataset.id);
      renderFinancas(container);
    };
  });
}
