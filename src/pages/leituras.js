import { supabase } from '../supabaseClient.js';
import { state } from '../state.js';

let currentRating = 0;

export async function renderLeituras(container) {
  const [{ data: livros }, { data: filmes }] = await Promise.all([
    supabase.from('leituras').select('*').eq('user_id', state.user.id).order('created_at', { ascending: false }),
    supabase.from('filmes_series').select('*').eq('user_id', state.user.id).order('created_at', { ascending: false })
  ]);

  const livroCards = (livros || []).map((b) => `
    <div class="book-card" data-edit-livro="${b.id}" style="cursor:pointer">
      ${b.capa_url ? `<img src="${b.capa_url}" class="book-cover" style="object-fit:cover">` : '<div class="book-cover"></div>'}
      <div>
        <div class="book-title">${b.titulo}</div>
        <div class="book-meta">${b.autor || 'Autor não informado'}</div>
        <div class="book-meta">${fmtRange(b.data_inicio, b.data_fim)}</div>
        <div class="stars">${'★'.repeat(b.nota || 0)}${'☆'.repeat(5 - (b.nota || 0))}</div>
      </div>
    </div>`).join('') || '<div class="empty-hint">Nenhum livro ainda.</div>';

  const filmeCards = (filmes || []).map((f) => `
    <div class="book-card">
      <div class="book-cover"></div>
      <div>
        <div class="book-title">${f.titulo}</div>
        <div class="book-meta">${f.tipo === 'serie' ? 'Série' : 'Filme'}</div>
        <div class="stars">${'★'.repeat(f.nota || 0)}${'☆'.repeat(5 - (f.nota || 0))}</div>
      </div>
    </div>`).join('') || '<div class="empty-hint">Nenhum filme/série ainda.</div>';

  container.innerHTML = `
    <div class="page-header">
      <div><h1 class="page-title">Leituras</h1><div class="page-sub">${(livros || []).length} LIVROS · ${(filmes || []).length} FILMES/SÉRIES</div></div>
    </div>
    <div class="card">
      <div class="card-title">Estante <button class="btn small" id="addBook">+ Novo livro</button></div>
      <div class="grid-2">${livroCards}</div>
    </div>
    <div class="card">
      <div class="card-title">Filmes e séries <button class="btn small" id="addFilme">+ Novo</button></div>
      <div class="grid-2">${filmeCards}</div>
    </div>
    <div id="bookModalRoot"></div>
  `;

  container.querySelector('#addBook').onclick = () => openBookModal(container, null);
  container.querySelectorAll('[data-edit-livro]').forEach((card) => {
    card.onclick = () => {
      const livro = livros.find((b) => b.id === card.dataset.editLivro);
      openBookModal(container, livro);
    };
  });

  container.querySelector('#addFilme').onclick = async () => {
    const titulo = prompt('Título do filme/série:');
    if (!titulo) return;
    const isSerie = confirm('É uma série? (Cancelar = Filme)');
    await supabase.from('filmes_series').insert({ user_id: state.user.id, titulo, tipo: isSerie ? 'serie' : 'filme', nota: 0 });
    renderLeituras(container);
  };
}

function fmtRange(inicio, fim) {
  const fmt = (iso) => { if (!iso) return null; const [y, m, d] = iso.split('-'); return `${d}.${m}.${y}`; };
  const i = fmt(inicio), f = fmt(fim);
  if (i && f) return `${i} → ${f}`;
  if (i) return `Início: ${i}`;
  if (f) return `Fim: ${f}`;
  return 'Datas não informadas';
}

function openBookModal(container, livro) {
  currentRating = livro?.nota || 0;
  const root = container.querySelector('#bookModalRoot');
  root.innerHTML = `
    <div class="modal-backdrop">
      <div class="modal-card">
        <div class="card-title">${livro ? 'Editar livro' : 'Novo livro'}
          ${livro ? '<button class="btn small" id="deleteBook">Excluir</button>' : ''}
        </div>
        <label>Título</label>
        <input type="text" id="mTitulo" value="${livro?.titulo || ''}" placeholder="Nome do livro">
        <label>Autor</label>
        <input type="text" id="mAutor" value="${livro?.autor || ''}" placeholder="Nome do autor">
        <div class="grid-2">
          <div><label>Início da leitura</label><input type="date" id="mInicio" value="${livro?.data_inicio || ''}"></div>
          <div><label>Fim da leitura</label><input type="date" id="mFim" value="${livro?.data_fim || ''}"></div>
        </div>
        <label>Avaliação</label>
        <div class="star-picker" id="starPicker"></div>
        <label>Capa</label>
        <input type="file" id="mCapa" accept="image/*">
        ${livro?.capa_url ? `<img src="${livro.capa_url}" style="width:60px;margin-top:8px;border-radius:3px">` : ''}
        <div class="login-actions" style="margin-top:20px">
          <button class="btn" id="saveBook">Salvar</button>
          <button class="btn small" id="cancelBook">Cancelar</button>
        </div>
        <div id="modalMsg" class="login-msg"></div>
      </div>
    </div>
  `;

  const starPicker = root.querySelector('#starPicker');
  function drawStars() {
    starPicker.innerHTML = [1, 2, 3, 4, 5].map((n) =>
      `<span class="star-pick ${n <= currentRating ? 'on' : ''}" data-n="${n}">${n <= currentRating ? '★' : '☆'}</span>`
    ).join('');
    starPicker.querySelectorAll('.star-pick').forEach((s) => {
      s.onclick = () => { currentRating = parseInt(s.dataset.n, 10); drawStars(); };
    });
  }
  drawStars();

  root.querySelector('#cancelBook').onclick = () => { root.innerHTML = ''; };

  const deleteBtn = root.querySelector('#deleteBook');
  if (deleteBtn) deleteBtn.onclick = async () => {
    if (!confirm('Excluir esse livro?')) return;
    await supabase.from('leituras').delete().eq('id', livro.id);
    root.innerHTML = '';
    renderLeituras(container);
  };

  root.querySelector('#saveBook').onclick = async () => {
    const msg = root.querySelector('#modalMsg');
    const titulo = root.querySelector('#mTitulo').value.trim();
    if (!titulo) { msg.textContent = 'Título é obrigatório.'; return; }
    const autor = root.querySelector('#mAutor').value.trim();
    const data_inicio = root.querySelector('#mInicio').value || null;
    const data_fim = root.querySelector('#mFim').value || null;
    const file = root.querySelector('#mCapa').files[0];

    msg.textContent = 'Salvando…';
    let capa_url = livro?.capa_url || null;

    if (file) {
      const path = `${state.user.id}/${Date.now()}-${file.name}`;
      const { error: upErr } = await supabase.storage.from('capas-livros').upload(path, file);
      if (upErr) { msg.textContent = 'Erro no upload da capa: ' + upErr.message; return; }
      const { data: pub } = supabase.storage.from('capas-livros').getPublicUrl(path);
      capa_url = pub.publicUrl;
    }

    const payload = { titulo, autor, data_inicio, data_fim, nota: currentRating, capa_url };
    const { error } = livro
      ? await supabase.from('leituras').update(payload).eq('id', livro.id)
      : await supabase.from('leituras').insert({ user_id: state.user.id, ...payload });

    if (error) { msg.textContent = 'Erro: ' + error.message; return; }
    root.innerHTML = '';
    renderLeituras(container);
  };
}
