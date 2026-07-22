import { supabase } from '../supabaseClient.js';
import { state, MESES, daysInMonth } from '../state.js';

export async function renderHabitos(container) {
  const mes = MESES[state.month];
  const dim = daysInMonth();
  const start = `${state.year}-${String(state.month + 1).padStart(2, '0')}-01`;
  const end = `${state.year}-${String(state.month + 1).padStart(2, '0')}-${String(dim).padStart(2, '0')}`;

  const [{ data: habitos }, { data: checks }, { data: consultas }, { data: medicacoes }] = await Promise.all([
    supabase.from('habitos').select('*').eq('user_id', state.user.id).eq('ativo', true).order('ordem'),
    supabase.from('habito_checks').select('*').eq('user_id', state.user.id).gte('data', start).lte('data', end),
    supabase.from('saude_consultas').select('*').eq('user_id', state.user.id).gte('data', start).lte('data', end).order('data'),
    supabase.from('saude_medicacoes').select('*').eq('user_id', state.user.id).order('created_at', { ascending: false })
  ]);

  const toBR = (iso) => { const [y, m, d] = iso.split('-'); return `${d}.${m}.${y}`; };
  const brToISO = (br) => {
    const parts = br.split(/[./-]/);
    if (parts.length !== 3) return null;
    const [d, m, y] = parts;
    return `${y.length === 2 ? '20' + y : y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  };

  const checkMap = {};
  (checks || []).forEach((c) => { checkMap[`${c.habito_id}-${c.data}`] = c; });

  let head = '<th>Hábito</th>';
  for (let d = 1; d <= dim; d++) head += `<th>${d}</th>`;
  const rows = (habitos || []).map((h) => {
    let cells = '';
    for (let d = 1; d <= dim; d++) {
      const dataStr = `${state.year}-${String(state.month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const key = `${h.id}-${dataStr}`;
      const on = !!checkMap[key];
      cells += `<td><div class="check ${on ? 'on' : ''}" data-habito="${h.id}" data-data="${dataStr}"></div></td>`;
    }
    return `<tr><td>${h.nome}</td>${cells}</tr>`;
  }).join('') || '';

  const consultasRows = (consultas || []).map((c) => `
    <div class="entry">
      <div class="entry-meta">${toBR(c.data)} ${c.horario ? c.horario.substring(0,5) : ''}
        <span style="float:right">
          <button class="btn small edit-consulta" data-id="${c.id}">Editar</button>
          <button class="btn small delete-consulta" data-id="${c.id}">Excluir</button>
        </span>
      </div>
      ${c.especialidade}${c.observacoes ? ' — ' + c.observacoes : ''}
    </div>
  `).join('') || '<div class="empty-hint">Nenhuma consulta marcada este mês.</div>';

  const medRows = (medicacoes || []).map((m) => `
    <div class="entry" style="${m.ativo ? '' : 'opacity:0.5'}">
      <div class="entry-meta">${m.dosagem || ''} ${m.horario ? m.horario.substring(0,5) : ''}
        <span style="float:right">
          <button class="btn small toggle-med" data-id="${m.id}" data-ativo="${m.ativo}">${m.ativo ? 'Pausar' : 'Retomar'}</button>
          <button class="btn small delete-med" data-id="${m.id}">Excluir</button>
        </span>
      </div>
      <b>${m.medicamento}</b>${m.funcao ? ' — ' + m.funcao : ''}${!m.ativo ? ' <em>(pausado)</em>' : ''}
    </div>
  `).join('') || '<div class="empty-hint">Nenhuma medicação cadastrada.</div>';

  container.innerHTML = `
    <div class="page-header">
      <div><h1 class="page-title">Hábitos &amp; Saúde</h1><div class="page-sub">${mes.toUpperCase()} · ${state.year}</div></div>
    </div>
    <div class="card" style="overflow-x:auto">
      <div class="card-title">Rastreador do mês <button class="btn small" id="addHabit">+ Novo hábito</button></div>
      <table class="habit-table"><thead><tr>${head}</tr></thead><tbody>${rows}</tbody></table>
    </div>
    <div class="grid-2">
      <div class="card">
        <div class="card-title">Consultas <button class="btn small" id="addConsulta">+ Nova</button></div>
        ${consultasRows}
      </div>
      <div class="card">
        <div class="card-title">Medicações <button class="btn small" id="addMed">+ Nova</button></div>
        ${medRows}
      </div>
    </div>
  `;

  container.querySelectorAll('.check').forEach((c) => {
    c.onclick = async () => {
      const habitoId = c.dataset.habito;
      const dataStr = c.dataset.data;
      const key = `${habitoId}-${dataStr}`;
      const existing = checkMap[key];
      if (existing) {
        await supabase.from('habito_checks').delete().eq('id', existing.id);
      } else {
        await supabase.from('habito_checks').insert({ user_id: state.user.id, habito_id: habitoId, data: dataStr, feito: true });
      }
      renderHabitos(container);
    };
  });

  container.querySelector('#addHabit').onclick = async () => {
    const nome = prompt('Nome do novo hábito:');
    if (!nome) return;
    await supabase.from('habitos').insert({ user_id: state.user.id, nome, ordem: (habitos || []).length });
    renderHabitos(container);
  };

  container.querySelector('#addConsulta').onclick = async () => {
    const especialidade = prompt('Especialidade:');
    if (!especialidade) return;
    const dataBR = prompt('Data (dd.mm.aaaa):');
    if (!dataBR) return;
    const dataISO = brToISO(dataBR);
    if (!dataISO) { alert('Data inválida. Use o formato dd.mm.aaaa'); return; }
    const horario = prompt('Horário (hh:mm), deixe em branco se não souber:') || null;
    const { data: novaConsulta, error } = await supabase
      .from('saude_consultas')
      .insert({ user_id: state.user.id, especialidade, data: dataISO, horario })
      .select()
      .single();
    if (error) { alert('Erro: ' + error.message); return; }
    // já cria a entrada correspondente no diário
    await supabase.from('diario_entradas').insert({
      user_id: state.user.id,
      data: dataISO,
      horario,
      conteudo: `Consulta: ${especialidade}`
    });
    renderHabitos(container);
  };

  container.querySelector('#addMed').onclick = async () => {
    const medicamento = prompt('Nome do medicamento:');
    if (!medicamento) return;
    const dosagem = prompt('Dosagem (opcional):') || null;
    const horario = prompt('Horário (hh:mm, opcional):') || null;
    const funcao = prompt('Pra que serve (opcional):') || null;
    await supabase.from('saude_medicacoes').insert({ user_id: state.user.id, medicamento, dosagem, horario, funcao });
    renderHabitos(container);
  };

  container.querySelectorAll('.edit-consulta').forEach((btn) => {
    btn.onclick = async () => {
      const c = consultas.find((x) => x.id === btn.dataset.id);
      const especialidade = prompt('Especialidade:', c.especialidade);
      if (!especialidade) return;
      const dataBR = prompt('Data (dd.mm.aaaa):', toBR(c.data));
      if (!dataBR) return;
      const dataISO = brToISO(dataBR);
      if (!dataISO) { alert('Data inválida. Use o formato dd.mm.aaaa'); return; }
      const horario = prompt('Horário (hh:mm):', c.horario ? c.horario.substring(0,5) : '') || null;
      const observacoes = prompt('Observações (opcional):', c.observacoes || '') || null;
      await supabase.from('saude_consultas').update({ especialidade, data: dataISO, horario, observacoes }).eq('id', c.id);
      renderHabitos(container);
    };
  });

  container.querySelectorAll('.delete-consulta').forEach((btn) => {
    btn.onclick = async () => {
      if (!confirm('Excluir essa consulta? (a entrada no diário criada junto não será apagada)')) return;
      await supabase.from('saude_consultas').delete().eq('id', btn.dataset.id);
      renderHabitos(container);
    };
  });

  container.querySelectorAll('.toggle-med').forEach((btn) => {
    btn.onclick = async () => {
      const ativo = btn.dataset.ativo === 'true';
      await supabase.from('saude_medicacoes').update({ ativo: !ativo }).eq('id', btn.dataset.id);
      renderHabitos(container);
    };
  });

  container.querySelectorAll('.delete-med').forEach((btn) => {
    btn.onclick = async () => {
      if (!confirm('Excluir essa medicação?')) return;
      await supabase.from('saude_medicacoes').delete().eq('id', btn.dataset.id);
      renderHabitos(container);
    };
  });
}
