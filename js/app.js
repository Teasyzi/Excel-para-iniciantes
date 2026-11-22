/* App: navegação, progresso, widgets (quiz, tabela dinâmica, "no seu Excel") */
(function () {
  'use strict';
  const { TRAILS, LESSONS } = window.COURSE;
  const app = document.getElementById('app');
  const $ = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html !== undefined) e.innerHTML = html; return e; };
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  /* ---------- progresso (localStorage, com proteção) ---------- */
  const OLD_KEY = 'excel-do-zero-v1';
  let KEY = OLD_KEY, prog = { done: {}, help: {} };
  const rd = (k) => { try { const s = localStorage.getItem(k); return s ? JSON.parse(s) : null; } catch (e) { return null; } };
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(prog)); } catch (e) { /* ignora */ } };
  // progresso de cada conta fica separado; o progresso anônimo antigo é adotado pela primeira conta
  function loadProgress() {
    const u = Auth.user(); KEY = u ? OLD_KEY + ':' + u.id : OLD_KEY;
    prog = Object.assign({ done: {}, help: {} }, rd(KEY) || (u && rd(OLD_KEY)) || {});
    const bar = document.getElementById('userbar');
    bar.innerHTML = '';
    if (u) {
      const who = $('span', 'who', '👤 ' + esc(u.name)); const out = $('button', 'link', 'Sair');
      out.addEventListener('click', () => { Auth.logout(); loadProgress(); go('#/entrar'); });
      bar.append(who, out);
    }
  }
  const stepKey = (l, i) => l.id + ':' + i;
  const isDone = (l, i) => !!prog.done[stepKey(l, i)];
  const lessonDone = (l) => l.steps.every((_, i) => isDone(l, i));
  const lessonCount = (l) => l.steps.filter((_, i) => isDone(l, i)).length;
  const firstPending = () => { for (const l of LESSONS) { const i = l.steps.findIndex((_, k) => !isDone(l, k)); if (i >= 0) return { l, i }; } return null; };

  /* ---------- rotas: #/  e  #/aula/<id>/<passo> ---------- */
  function route() {
    const h = location.hash.replace(/^#\/?/, '').split('/');
    window.scrollTo(0, 0);
    if (!Auth.user()) return renderAuth(h[0] === 'cadastro' ? 'cadastro' : 'entrar');
    if (h[0] === 'entrar' || h[0] === 'cadastro') return go('#/');
    if (h[0] === 'aula') {
      const l = LESSONS.find((x) => x.id === h[1]);
      if (l) { const i = Math.max(0, Math.min(l.steps.length, parseInt(h[2] || '0', 10) || 0)); return i >= l.steps.length ? renderLessonEnd(l) : renderStep(l, i); }
    }
    renderHome();
  }
  const go = (hash) => { if (location.hash === hash) route(); else location.hash = hash; };
  window.addEventListener('hashchange', route);

  /* ---------- entrar / cadastrar ---------- */
  function renderAuth(mode) {
    document.title = (mode === 'cadastro' ? 'Criar conta' : 'Entrar') + ' · Excel do Zero';
    loadProgress(); app.innerHTML = '';
    const reg = mode === 'cadastro';
    const box = $('main', 'auth card');
    box.innerHTML = `<p class="tag">${reg ? 'Primeira vez aqui?' : 'Bem-vindo de volta'}</p><h1>${reg ? 'Crie sua conta' : 'Entre na sua conta'}</h1>
      <p class="muted">${reg ? 'Assim seu progresso fica guardado só para você.' : 'Continue de onde parou.'}</p>
      <form novalidate>
        ${reg ? '<label>Seu nome<input name="name" autocomplete="name" required></label>' : ''}
        <label>E-mail<input name="email" type="email" autocomplete="${reg ? 'email' : 'username'}" required></label>
        <label>Senha<input name="pass" type="password" autocomplete="${reg ? 'new-password' : 'current-password'}" required minlength="6"></label>
        ${reg ? '<label>Repita a senha<input name="pass2" type="password" autocomplete="new-password" required></label>' : ''}
        <div class="msg" role="alert"></div>
        <button class="btn primary big" type="submit">${reg ? 'Criar conta e começar' : 'Entrar'}</button>
      </form>
      <p class="switch">${reg ? 'Já tem conta? <a href="#/entrar">Entrar</a>' : 'Ainda não tem conta? <a href="#/cadastro">Criar conta</a>'}</p>
      <p class="muted small">🔒 A senha é transformada em um código irreversível (PBKDF2) e nunca é guardada. Tudo fica neste navegador, sem servidor: se limpar os dados do navegador, a conta some.</p>`;
    app.appendChild(box);
    const f = box.querySelector('form'), msg = box.querySelector('.msg'), sub = f.querySelector('button');
    f.addEventListener('submit', async (e) => {
      e.preventDefault(); const d = Object.fromEntries(new FormData(f));
      msg.className = 'msg'; msg.textContent = '';
      if (reg && d.pass !== d.pass2) { msg.className = 'msg warn'; msg.textContent = 'As senhas não são iguais.'; return; }
      sub.disabled = true;
      try { if (reg) await Auth.register(d.name, d.email, d.pass); else await Auth.login(d.email, d.pass); loadProgress(); if (reg) save(); go('#/'); }
      catch (err) { msg.className = 'msg warn'; msg.textContent = err.message; sub.disabled = false; }
    });
    f.querySelector('input').focus();
  }

  /* ---------- início ---------- */
  function renderHome() {
    document.title = 'Excel do Zero — aprenda fazendo';
    const total = LESSONS.reduce((a, l) => a + l.steps.length, 0), done = Object.keys(prog.done).length;
    const next = firstPending();
    app.innerHTML = '';
    const hero = $('section', 'hero');
    hero.innerHTML = `<div class="hero-txt"><p class="eyebrow">Excel do Zero ao Avançado</p>
      <h1>Aprenda Excel <em>fazendo</em>, um passo por vez.</h1>
      <p class="lead">Feito para quem está começando do zero e quer usar o Excel no <strong>trabalho</strong> e em <strong>análise de dados</strong>. Cada passo tem um desenho, uma explicação curtinha e uma missão para você fazer numa planilha de verdade (simulada aqui na tela).</p></div>`;
    const cta = $('div', 'cta');
    const btn = $('button', 'btn primary big', next ? (done ? '▶ Continuar de onde parei' : '▶ Começar agora') : '🎉 Revisar do começo');
    btn.addEventListener('click', () => { if (next) go(`#/aula/${next.l.id}/${next.i}`); else go(`#/aula/${LESSONS[0].id}/0`); });
    cta.appendChild(btn); hero.querySelector('.hero-txt').appendChild(cta);
    const prof = $('aside', 'plan');
    prof.innerHTML = `<h2>Seu plano</h2><ul>
      <li><span>🎯</span><div><strong>Objetivo</strong><br>Trabalho e análise de dados</div></li>
      <li><span>🌱</span><div><strong>Ponto de partida</strong><br>Do zero: sem pular etapas</div></li>
      <li><span>💻</span><div><strong>Seu Excel</strong><br>Microsoft 365 no PC (com PROCX, FILTRO, ÚNICO…)</div></li></ul>
      <div class="meter" aria-label="Progresso"><div style="width:${Math.round(done / total * 100)}%"></div></div><p class="muted">${done} de ${total} passos concluídos</p>`;
    hero.appendChild(prof); app.appendChild(hero);

    const map = $('section', 'map'); map.appendChild($('h2', '', 'Trilha de aprendizado'));
    TRAILS.forEach((t) => {
      const ls = LESSONS.filter((l) => l.trail === t.id);
      const box = $('div', 'trail');
      box.innerHTML = `<div class="trail-head"><span class="trail-emoji">${t.emoji}</span><div><h3>${t.name}</h3><span class="chip">${t.level}</span></div></div>`;
      const list = $('div', 'lessons');
      ls.forEach((l) => {
        const n = lessonCount(l), all = l.steps.length;
        const a = $('a', 'lesson-card' + (n === all ? ' done' : ''));
        const idx = n === all ? 0 : n;
        a.href = `#/aula/${l.id}/${idx}`;
        a.innerHTML = `<div class="lc-top"><strong>${l.title}</strong><span class="lc-state">${n === all ? '✓' : n ? '…' : ''}</span></div>
          <div class="lc-meta">${all} passos · ${l.time}</div><div class="meter sm"><div style="width:${n / all * 100}%"></div></div>`;
        list.appendChild(a);
      });
      box.appendChild(list); map.appendChild(box);
    });
    app.appendChild(map);
    const foot = $('footer', 'foot');
    foot.innerHTML = '<p>Seu progresso fica salvo neste navegador. <button class="link" id="reset-all">Zerar progresso</button></p>';
    foot.querySelector('#reset-all').addEventListener('click', () => { if (confirm('Apagar todo o seu progresso?')) { prog = { done: {}, help: {} }; save(); renderHome(); } });
    app.appendChild(foot);
  }

  /* ---------- passo ---------- */
  function renderStep(l, i) {
    const step = l.steps[i];
    document.title = `${step.title} · ${l.title}`;
    app.innerHTML = '';
    const top = $('header', 'lesson-top');
    top.innerHTML = `<a href="#/" class="back">← Trilha</a><div class="crumb"><span>${l.title}</span><strong>Passo ${i + 1} de ${l.steps.length}</strong></div>`;
    const dots = $('div', 'dots');
    l.steps.forEach((_, k) => { const d = $('a', 'dot' + (k === i ? ' now' : '') + (isDone(l, k) ? ' ok' : '')); d.href = `#/aula/${l.id}/${k}`; d.title = `Passo ${k + 1}`; d.textContent = k + 1; dots.appendChild(d); });
    top.appendChild(dots); app.appendChild(top);

    const main = $('main', 'step');
    const learn = $('section', 'card learn');
    learn.innerHTML = `<p class="tag">1 · Entenda</p><h1>${step.title}</h1><div class="say">${step.say}</div>${step.draw ? `<figure class="figure">${step.draw}</figure>` : ''}`;
    const doit = $('section', 'card doit');
    doit.innerHTML = `<p class="tag">2 · Faça</p>`;
    const mission = $('div', 'mission'); mission.innerHTML = step.task ? `<span class="m-ico">🎯</span><div>${step.task}</div>` : '';
    if (step.quiz) mission.innerHTML = `<span class="m-ico">🎯</span><div>${esc(step.quiz.q)}</div>`;
    if (step.real) mission.innerHTML = `<span class="m-ico">🖥️</span><div>Faça no <strong>seu Excel</strong> e marque cada item.</div>`;
    doit.appendChild(mission);
    const stage = $('div', 'stage'); doit.appendChild(stage);
    const msg = $('div', 'msg'); msg.setAttribute('aria-live', 'polite'); doit.appendChild(msg);
    const helpRow = $('div', 'help');
    doit.appendChild(helpRow);
    main.append(learn, doit); app.appendChild(main);

    const nav = $('footer', 'nav');
    const prev = $('a', 'btn ghost', '← Voltar'); prev.href = i > 0 ? `#/aula/${l.id}/${i - 1}` : '#/';
    const nextBtn = $('a', 'btn primary', i === l.steps.length - 1 ? 'Concluir aula →' : 'Próximo passo →');
    nextBtn.href = `#/aula/${l.id}/${i + 1}`;
    const skip = $('button', 'link', 'Pular este passo');
    nav.append(prev, skip, nextBtn); app.appendChild(nav);

    let finished = isDone(l, i), hintLevel = 0, solver = null;
    const setNavState = () => { nextBtn.classList.toggle('locked', !finished); nextBtn.setAttribute('aria-disabled', String(!finished)); skip.style.display = finished ? 'none' : ''; };
    nextBtn.addEventListener('click', (e) => { if (!finished) { e.preventDefault(); msg.className = 'msg warn'; msg.innerHTML = 'Faça a missão (ou use a dica / “Pular este passo”) para avançar.'; } });
    skip.addEventListener('click', () => go(`#/aula/${l.id}/${i + 1}`));
    setNavState();

    const succeed = (extra) => {
      if (finished && prog.done[stepKey(l, i)]) { return; }
      finished = true; prog.done[stepKey(l, i)] = true; save(); setNavState();
      msg.className = 'msg ok'; msg.innerHTML = `<strong>✔ Muito bem!</strong> ${extra || step.win || ''}`;
      dots.children[i].classList.add('ok'); nextBtn.classList.add('pulse');
    };
    const hintBtn = $('button', 'btn small', '💡 Dica'), showBtn = $('button', 'btn small ghost', '👀 Mostrar a resposta');
    showBtn.style.display = 'none';
    hintBtn.addEventListener('click', () => {
      hintLevel = 1; msg.className = 'msg hint'; msg.innerHTML = '<strong>Dica:</strong> ' + step.hint; showBtn.style.display = '';
    });
    showBtn.addEventListener('click', () => { prog.help[stepKey(l, i)] = true; if (solver) solver(); });
    if (step.hint) helpRow.appendChild(hintBtn);
    if (step.solve) helpRow.appendChild(showBtn);

    /* --- tipo: planilha --- */
    if (step.sheet) {
      const host = $('div', 'sheet-host'); stage.appendChild(host);
      let view;
      const onChange = (ctx) => {
        if (!step.check || finished) return;
        let r; try { r = step.check(ctx); } catch (e) { r = false; }
        if (r === true) succeed();
        else if (typeof r === 'string') { msg.className = 'msg warn'; msg.innerHTML = r; }
        else if (msg.classList.contains('warn')) { msg.className = 'msg'; msg.innerHTML = ''; }
      };
      view = new SheetView(host, step.sheet, onChange);
      view.setHighlight(finished ? [] : step.hl);
      if (!finished) view.touched = false;
      solver = () => { step.solve(view); };
      window.__view = view; window.__step = step;
      setTimeout(() => view.focus(), 50);
    }

    /* --- tipo: quiz --- */
    if (step.quiz) {
      const q = step.quiz; const box = $('div', 'quiz');
      q.options.forEach((o, k) => {
        const b = $('button', 'opt', `<span class="opt-l">${'ABCD'[k]}</span><span>${esc(o)}</span>`); b.type = 'button';
        b.addEventListener('click', () => {
          if (k === q.correct) { box.querySelectorAll('.opt').forEach((x) => x.classList.remove('bad')); b.classList.add('good'); succeed(esc(q.why)); }
          else { b.classList.add('bad'); msg.className = 'msg warn'; msg.innerHTML = 'Quase! Pense de novo e tente outra opção.'; }
        });
        box.appendChild(b);
      });
      stage.appendChild(box);
      solver = () => { box.children[q.correct].click(); };
      showBtn.style.display = ''; helpRow.appendChild(showBtn);
      if (finished) box.children[q.correct].classList.add('good');
    }

    /* --- tipo: tabela dinâmica --- */
    if (step.pivot) {
      const w = pivotWidget(step.pivot, (state) => {
        if (finished) return;
        if (step.check({ pivot: state })) succeed();
      });
      stage.appendChild(w.el); solver = () => step.solve(w);
    }

    /* --- tipo: fazer no Excel real --- */
    if (step.real) {
      const w = realWidget(step.real, (all) => { if (all) succeed('Ótimo trabalho!'); });
      stage.appendChild(w.el); solver = null; showBtn.style.display = 'none'; showBtn.remove(); hintBtn.remove();
      if (finished) w.checkAll();
    }
    if (finished && step.win !== undefined && !msg.innerHTML) { msg.className = 'msg ok'; msg.innerHTML = '<strong>✔ Passo já concluído.</strong> ' + (step.win || ''); }
  }

  /* ---------- widget: tabela dinâmica ---------- */
  function pivotWidget(cfg, onChange) {
    const st = { row: null, val: null, op: 'SOMA' };
    const el = $('div', 'pivot');
    const fieldsBox = $('div', 'pv-fields'), zones = $('div', 'pv-zones'), out = $('div', 'pv-out');
    el.append(fieldsBox, zones, out);
    const table = $('table', 'pv-src');
    table.innerHTML = '<thead><tr>' + cfg.fields.map((f) => `<th>${f.name}</th>`).join('') + '</tr></thead><tbody>' + cfg.rows.map((r) => '<tr>' + r.map((c, i) => `<td class="${cfg.fields[i].type === 'num' ? 'num' : ''}">${c}</td>`).join('') + '</tr>').join('') + '</tbody>';
    const src = $('details', 'pv-details'); src.open = true; src.innerHTML = '<summary>Dados (tabela original)</summary>'; const sc = $('div', 'pv-scroll'); sc.appendChild(table); src.appendChild(sc);
    el.insertBefore(src, fieldsBox);
    function draw() {
      fieldsBox.innerHTML = '<p class="pv-t">Campos da tabela dinâmica <span class="muted">(clique para usar)</span></p>';
      const chips = $('div', 'chips');
      cfg.fields.forEach((f) => {
        const on = st.row === f.name || st.val === f.name;
        const c = $('button', 'chip-f' + (on ? ' on' : ''), (f.type === 'num' ? '123 ' : 'Aa ') + f.name); c.type = 'button';
        c.addEventListener('click', () => {
          if (st.row === f.name) st.row = null; else if (st.val === f.name) st.val = null;
          else if (f.type === 'num') st.val = f.name; else st.row = f.name;
          draw(); onChange(st);
        });
        chips.appendChild(c);
      });
      fieldsBox.appendChild(chips);
      zones.innerHTML = '';
      const z1 = $('div', 'zone', `<span class="z-t">Linhas</span><span class="z-v">${st.row ? esc(st.row) : '<i>vazio</i>'}</span>`);
      const z2 = $('div', 'zone', `<span class="z-t">Valores</span><span class="z-v">${st.val ? esc(st.val) : '<i>vazio</i>'}</span>`);
      const sel = $('select', 'op'); sel.setAttribute('aria-label', 'Operação');
      [['SOMA', 'Soma'], ['CONT', 'Contagem'], ['MEDIA', 'Média']].forEach(([v, t]) => { const o = $('option', '', t); o.value = v; if (v === st.op) o.selected = true; sel.appendChild(o); });
      sel.addEventListener('change', () => { st.op = sel.value; draw(); onChange(st); });
      z2.appendChild(sel); zones.append(z1, z2);
      out.innerHTML = '';
      if (st.row && st.val) {
        const ri = cfg.fields.findIndex((f) => f.name === st.row), vi = cfg.fields.findIndex((f) => f.name === st.val);
        const groups = new Map(); cfg.rows.forEach((r) => { if (!groups.has(r[ri])) groups.set(r[ri], []); groups.get(r[ri]).push(r[vi]); });
        const agg = (a) => st.op === 'SOMA' ? a.reduce((x, y) => x + y, 0) : st.op === 'CONT' ? a.length : a.reduce((x, y) => x + y, 0) / a.length;
        const names = { SOMA: 'Soma de ', CONT: 'Contagem de ', MEDIA: 'Média de ' };
        const keys = [...groups.keys()].sort((a, b) => String(a).localeCompare(b, 'pt'));
        let tot = []; keys.forEach((k) => { tot = tot.concat(groups.get(k)); });
        const fmt = (n) => Number.isInteger(n) ? n.toLocaleString('pt-BR') : n.toLocaleString('pt-BR', { maximumFractionDigits: 2 });
        out.innerHTML = `<p class="pv-t">Resultado</p><table class="pv-res"><thead><tr><th>${esc(st.row)}</th><th>${names[st.op]}${esc(st.val)}</th></tr></thead><tbody>${keys.map((k) => `<tr><td>${esc(k)}</td><td class="num">${fmt(agg(groups.get(k)))}</td></tr>`).join('')}<tr class="tot"><td>Total Geral</td><td class="num">${fmt(agg(tot))}</td></tr></tbody></table>`;
      } else out.innerHTML = '<p class="muted pv-empty">Escolha um campo para <strong>Linhas</strong> e um número para <strong>Valores</strong>, e o resumo aparece aqui.</p>';
    }
    draw();
    return { el, set: (s) => { Object.assign(st, s); draw(); onChange(st); } };
  }

  /* ---------- widget: fazer no Excel real ---------- */
  function realWidget(cfg, onDone) {
    const el = $('div', 'real'); const boxes = [];
    if (cfg.data) {
      const row = $('div', 'real-data'); const b = $('button', 'btn small', '📋 Copiar dados'); b.type = 'button';
      const pre = $('pre', 'real-pre'); pre.textContent = cfg.data;
      b.addEventListener('click', async () => { try { await navigator.clipboard.writeText(cfg.data); b.textContent = '✔ Copiado! Cole na A1 do Excel'; } catch (e) { const r = document.createRange(); r.selectNodeContents(pre); const s = getSelection(); s.removeAllRanges(); s.addRange(r); b.textContent = 'Selecionado: aperte Ctrl+C'; } });
      row.append(b, $('span', 'muted', 'depois cole na célula A1 de uma planilha em branco')); el.append(row, pre);
    }
    const ol = $('ol', 'checks');
    cfg.items.forEach((t) => {
      const li = $('li'); const id = 'c' + Math.random().toString(36).slice(2, 8);
      li.innerHTML = `<input type="checkbox" id="${id}"><label for="${id}">${t}</label>`;
      const cb = li.querySelector('input'); boxes.push(cb);
      cb.addEventListener('change', () => { li.classList.toggle('on', cb.checked); onDone(boxes.every((x) => x.checked)); });
      ol.appendChild(li);
    });
    el.appendChild(ol);
    el.appendChild($('p', 'muted small', 'Eu não enxergo o seu Excel, então a confirmação é sua: marque quando ver o resultado esperado. Travou? Releia o passo ou refaça com calma.'));
    return { el, checkAll: () => boxes.forEach((b) => { b.checked = true; b.closest('li').classList.add('on'); }) };
  }

  /* ---------- fim da aula ---------- */
  function renderLessonEnd(l) {
    document.title = 'Aula concluída · ' + l.title;
    const idx = LESSONS.indexOf(l), nx = LESSONS[idx + 1];
    app.innerHTML = '';
    const box = $('main', 'end card');
    const help = l.steps.filter((_, k) => prog.help[stepKey(l, k)]).length;
    box.innerHTML = `<div class="trophy">${nx ? '🎉' : '🏆'}</div><h1>${nx ? 'Aula concluída!' : 'Curso concluído!'}</h1><p class="lead">${esc(l.title)} — ${lessonCount(l)} de ${l.steps.length} passos feitos${help ? `, ${help} com ajuda (sem problema, refaça depois se quiser)` : ''}.</p>`;
    const row = $('div', 'cta');
    if (nx) { const a = $('a', 'btn primary big', `Próxima: ${nx.title} →`); a.href = `#/aula/${nx.id}/0`; row.appendChild(a); }
    const h = $('a', 'btn ghost', 'Ver a trilha'); h.href = '#/'; row.appendChild(h);
    const r = $('a', 'btn ghost', '↻ Refazer esta aula'); r.href = `#/aula/${l.id}/0`; row.appendChild(r);
    box.appendChild(row);
    if (!nx) box.appendChild($('p', 'muted', 'Próximos passos: pratique com dados do seu trabalho. Escolha uma tarefa que você faz à mão toda semana e automatize com o que aprendeu.'));
    app.appendChild(box);
  }

  loadProgress();
  route();
})();
