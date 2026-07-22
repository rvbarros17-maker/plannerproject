import { supabase } from '../supabaseClient.js';
import { state, MESES } from '../state.js';

export async function renderMetas(container) {
  const mes = MESES[state.month];
  const { data: metas } = await supabase
    .from('metas')
    .select('*')
    .eq('user_id', state.user.id)
    .eq('mes', state.month + 1)
    .eq('ano', state.year)
    .order('ordem');

  const rows = (metas || []).map((m) => `
    <div class="meta-item">
      <div class="meta-check ${m.done ? 'done' : ''}" data-id="${m.id}"></div>
      <input type="text" value="${m.texto || ''}" data-id="${m.id}" placeholder="Descreva a meta">
      <button class="btn small delete-meta" data-id="${m.id}">×</button>
    </div>`).join('') || '<div class="empty-hint">Nenhuma meta ainda. Adicione quantas quiser este mês.</div>';

  container.innerHTML = `
    <div class="page-header">
      <div><h1 class="page-title">Metas</h1><div class="page-sub">${mes.toUpperCase()} · ${state.year}</div></div>
    </div>
    <div class="card">
      <div class="card-title">Metas de ${mes} <button class="btn small" id="addMeta">+ Nova meta</button></div>
      ${rows}
    </div>
  `;

  container.querySelector('#addMeta').onclick = async () => {
    await supabase.from('metas').insert({
      user_id: state.user.id, mes: state.month + 1, ano: state.year, texto: '', done: false, ordem: (metas || []).length
    });
    renderMetas(container);
  };

  container.querySelectorAll('.meta-check').forEach((c) => {
    c.onclick = async () => {
      const meta = metas.find((m) => m.id === c.dataset.id);
      await supabase.from('metas').update({ done: !meta.done }).eq('id', meta.id);
      renderMetas(container);
    };
  });

  container.querySelectorAll('.meta-item input').forEach((inp) => {
    let timeout;
    inp.oninput = () => {
      clearTimeout(timeout);
      timeout = setTimeout(async () => {
        await supabase.from('metas').update({ texto: inp.value }).eq('id', inp.dataset.id);
      }, 600);
    };
  });

  container.querySelectorAll('.delete-meta').forEach((btn) => {
    btn.onclick = async () => {
      await supabase.from('metas').delete().eq('id', btn.dataset.id);
      renderMetas(container);
    };
  });
}
