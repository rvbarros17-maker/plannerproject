import { supabase } from '../supabaseClient.js';
import { state, MESES } from '../state.js';

export async function renderInicio(container) {
  const mes = MESES[state.month];
  const monthStart = `${state.year}-${String(state.month + 1).padStart(2, '0')}-01`;
  const monthEnd = `${state.year}-${String(state.month + 1).padStart(2, '0')}-31`;

  const [{ count: diasCount }, { data: metasData }, { count: leiturasCount }] = await Promise.all([
    supabase.from('diario_entradas').select('data', { count: 'exact', head: true })
      .eq('user_id', state.user.id).gte('data', monthStart).lte('data', monthEnd),
    supabase.from('metas').select('done').eq('user_id', state.user.id).eq('mes', state.month + 1).eq('ano', state.year),
    supabase.from('leituras').select('id', { count: 'exact', head: true }).eq('user_id', state.user.id)
  ]);

  const metasTotal = metasData?.length || 0;
  const metasDone = metasData?.filter((m) => m.done).length || 0;

  container.innerHTML = `
    <div class="page-header">
      <div><h1 class="page-title">Bem-vindo de volta</h1><div class="page-sub">${mes.toUpperCase()} · ${state.year}</div></div>
    </div>
    <div class="grid-3">
      <div class="card"><div class="stat-num">${diasCount ?? 0}</div><div class="stat-label">Registros no diário este mês</div></div>
      <div class="card"><div class="stat-num">${metasDone}/${metasTotal}</div><div class="stat-label">Metas concluídas</div></div>
      <div class="card"><div class="stat-num">${leiturasCount ?? 0}</div><div class="stat-label">Leituras registradas</div></div>
    </div>
    <div class="card">
      <div class="card-title">Como usar</div>
      <div style="font-size:13px; line-height:1.7; color:var(--ink-soft)">
        Use a fita à direita pra trocar de mês. Cada seção no menu à esquerda guarda quantos registros você quiser — sem limite de página como no PDF.
      </div>
    </div>
  `;
}
