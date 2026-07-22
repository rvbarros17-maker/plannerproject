import { supabase } from '../supabaseClient.js';
import { state, MESES, DOW, daysInMonth, firstWeekdayOffset, isToday, currentWeekIndex } from '../state.js';

function isoDate(day, month = state.month, year = state.year) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

async function fetchMonthEntries() {
  const start = isoDate(1);
  const end = isoDate(daysInMonth());
  const { data, error } = await supabase
    .from('diario_entradas')
    .select('*')
    .eq('user_id', state.user.id)
    .gte('data', start)
    .lte('data', end)
    .order('data', { ascending: true });
  if (error) { console.error(error); return []; }
  return data;
}

export async function renderDiario(container) {
  const mes = MESES[state.month];
  const entries = await fetchMonthEntries();
  const byDay = {};
  entries.forEach((e) => {
    const d = parseInt(e.data.split('-')[2], 10);
    (byDay[d] = byDay[d] || []).push(e);
  });

  container.innerHTML = `
    <div class="page-header">
      <div><h1 class="page-title">Diário</h1><div class="page-sub">${mes.toUpperCase()} · ${state.year}</div></div>
      <div class="period-switch">
        <button data-p="mensal" class="${state.period === 'mensal' ? 'active' : ''}">MENSAL</button>
        <button data-p="semanal" class="${state.period === 'semanal' ? 'active' : ''}">SEMANAL</button>
        <button data-p="diario" class="${state.period === 'diario' ? 'active' : ''}">DIÁRIO</button>
      </div>
    </div>
    <div id="diarioBody"></div>
  `;

  container.querySelectorAll('.period-switch button').forEach((b) => {
    b.onclick = () => {
      const goingToSemanal = b.dataset.p === 'semanal' && state.period !== 'semanal';
      state.period = b.dataset.p;
      if (goingToSemanal) { const w = currentWeekIndex(); if (w !== null) state.week = w; }
      renderDiario(container);
    };
  });

  const body = container.querySelector('#diarioBody');
  if (state.period === 'mensal') renderMensal(body, byDay, container);
  else if (state.period === 'semanal') renderSemanal(body, byDay, container);
  else renderDiaView(body, entries.filter((e) => e.data === isoDate(state.day)), container);
}

function renderMensal(body, byDay, container) {
  const dim = daysInMonth();
  const offset = firstWeekdayOffset();
  let cells = DOW.map((d) => `<div class="cal-dow">${d}</div>`).join('');
  for (let i = 0; i < offset; i++) cells += '<div class="cal-day empty"></div>';
  for (let d = 1; d <= dim; d++) {
    const hasEntry = byDay[d] && byDay[d].length > 0;
    cells += `<div class="cal-day ${hasEntry ? 'has-entry' : ''} ${isToday(d) ? 'today' : ''}" data-day="${d}">${d}</div>`;
  }
  body.innerHTML = `<div class="card"><div class="card-title">${MESES[state.month]} — clique num dia pra abrir a página</div><div class="cal-grid">${cells}</div></div>`;
  body.querySelectorAll('.cal-day[data-day]').forEach((c) => {
    c.onclick = () => { state.day = parseInt(c.dataset.day, 10); state.period = 'diario'; renderDiario(container); };
  });
}

function renderSemanal(body, byDay, container) {
  const dim = daysInMonth();
  const offset = firstWeekdayOffset();
  const weeksCount = Math.ceil((dim + offset) / 7);
  let weekButtons = '';
  for (let w = 0; w < weeksCount; w++) {
    weekButtons += `<button class="btn small week-btn" data-week="${w}" style="${state.week === w ? 'background:var(--pine);color:#fff' : ''}">S${w + 1}</button>`;
  }
  const hojeWeek = currentWeekIndex();
  if (hojeWeek !== null) {
    weekButtons += `<button class="btn small" id="goToday">Semana atual</button>`;
  }
  let dayRows = '';
  for (let i = 0; i < 7; i++) {
    const dayNum = state.week * 7 + i - offset + 1;
    const valid = dayNum >= 1 && dayNum <= dim;
    const entries = valid ? (byDay[dayNum] || []) : [];
    dayRows += `
      <div class="entry" style="${valid ? '' : 'opacity:0.3'}">
        <div class="entry-meta">${DOW[i]} · ${valid ? dayNum + ' ' + MESES[state.month].toUpperCase() : '—'}</div>
        ${valid
          ? (entries.length
              ? [...entries].sort((a, b) => (a.horario || '99:99').localeCompare(b.horario || '99:99'))
                  .map((e) => `<div style="font-size:12px;color:var(--ink-soft)">${e.horario ? '<b>' + e.horario.substring(0,5) + '</b> — ' : ''}${(e.conteudo || '<em>sem anotação</em>').substring(0, 140)}</div>`).join('')
              : '<div class="empty-hint">Sem registro ainda</div>')
          : ''}
      </div>`;
  }
  body.innerHTML = `<div class="card"><div class="card-title">Semanas de ${MESES[state.month]}<div>${weekButtons}</div></div>${dayRows}</div>`;
  body.querySelectorAll('.week-btn').forEach((b) => {
    b.onclick = () => { state.week = parseInt(b.dataset.week, 10); renderDiario(container); };
  });
  const goToday = body.querySelector('#goToday');
  if (goToday) goToday.onclick = () => { state.week = currentWeekIndex(); renderDiario(container); };
}

function renderDiaView(body, dayEntries, container) {
  const mes = MESES[state.month];
  const sorted = [...dayEntries].sort((a, b) => (a.horario || '99:99').localeCompare(b.horario || '99:99'));
  const blocks = sorted.map((e) => `
    <div class="entry">
      <div class="entry-meta">
        <input type="time" class="entry-time" data-id="${e.id}" value="${e.horario ? e.horario.substring(0, 5) : ''}">
        <button class="btn small delete-entry" data-id="${e.id}" style="float:right">Excluir</button>
      </div>
      <textarea data-id="${e.id}">${e.conteudo || ''}</textarea>
    </div>
  `).join('') || '<div class="empty-hint">Nenhuma entrada ainda hoje. Adicione quantas quiser.</div>';

  body.innerHTML = `
    <div class="card">
      <div class="card-title">${state.day} de ${mes}
        <div style="display:flex;gap:6px">
          <button class="btn small" id="prevDay">←</button>
          <button class="btn small" id="nextDay">→</button>
        </div>
      </div>
      ${blocks}
      <button class="btn" id="addEntry" style="margin-top:6px">+ Adicionar página</button>
    </div>
  `;

  body.querySelector('#prevDay').onclick = () => { if (state.day > 1) state.day--; renderDiario(container); };
  body.querySelector('#nextDay').onclick = () => { if (state.day < daysInMonth()) state.day++; renderDiario(container); };

  body.querySelector('#addEntry').onclick = async () => {
    const { error } = await supabase.from('diario_entradas').insert({
      user_id: state.user.id, data: isoDate(state.day), conteudo: ''
    });
    if (error) { alert('Erro ao criar entrada: ' + error.message); return; }
    renderDiario(container);
  };

  body.querySelectorAll('textarea[data-id]').forEach((t) => {
    let timeout;
    t.oninput = () => {
      clearTimeout(timeout);
      timeout = setTimeout(async () => {
        await supabase.from('diario_entradas').update({ conteudo: t.value }).eq('id', t.dataset.id);
      }, 600); // salva 600ms depois de parar de digitar
    };
  });

  body.querySelectorAll('.entry-time').forEach((t) => {
    t.onchange = async () => {
      await supabase.from('diario_entradas').update({ horario: t.value || null }).eq('id', t.dataset.id);
      renderDiario(container);
    };
  });

  body.querySelectorAll('.delete-entry').forEach((btn) => {
    btn.onclick = async () => {
      if (!confirm('Excluir essa entrada?')) return;
      await supabase.from('diario_entradas').delete().eq('id', btn.dataset.id);
      renderDiario(container);
    };
  });
}
