/* Planilha interativa na tela (grade, barra de fórmulas, barra de ferramentas, gráfico) */
(function () {
  'use strict';
  const { Sheet, colName, colNum, addr, parseAddr, parseRange, rangeStr, display } = XL;
  const $ = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html !== undefined) e.innerHTML = html; return e; };
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  const TOOLS = {
    bold: { label: '<b>N</b>', title: 'Negrito (Ctrl+B)' },
    money: { label: 'R$', title: 'Formato moeda' },
    percent: { label: '%', title: 'Estilo de porcentagem' },
    fill: { label: '⬇ Preencher', title: 'Preencher para baixo (Ctrl+D)' },
    sortAZ: { label: 'A→Z', title: 'Classificar de A a Z (menor para maior)' },
    sortZA: { label: 'Z→A', title: 'Classificar de Z a A (maior para menor)' },
    chartCol: { label: '📊 Colunas', title: 'Inserir gráfico de colunas' },
    chartLine: { label: '📈 Linhas', title: 'Inserir gráfico de linhas' },
    chartPie: { label: '🥧 Pizza', title: 'Inserir gráfico de pizza' }
  };

  class SheetView {
    constructor(host, cfg, onChange) {
      this.cfg = Object.assign({ cols: 6, rows: 8, data: {}, tools: [], colW: null }, cfg);
      this.onChange = onChange || (() => {});
      this.host = host; this.sel = { c1: 1, r1: 1, c2: 1, r2: 1, ac: 1, ar: 1 };
      if (this.cfg.sel) { const g = parseRange(this.cfg.sel); this.sel = { c1: g.c1, r1: g.r1, c2: g.c2, r2: g.r2, ac: g.c1, ar: g.r1 }; }
      this.edit = null; this.chart = null; this.dragging = false; this.touched = false;
      this.reset(true);
    }
    reset(first) {
      this.sheet = new Sheet(this.cfg.data); this.chart = null; this.edit = null;
      if (this.cfg.fmt) for (const k in this.cfg.fmt) Object.assign(this.sheet.fmt(k), this.cfg.fmt[k]);
      this.build(); if (!first) this.emit();
    }
    emit() { this.onChange(this.context()); }

    /* contexto entregue às verificações dos passos */
    context() {
      const s = this.sheet, g = this.sel;
      return {
        sheet: s, view: this, chart: this.chart, touched: this.touched,
        v: (a) => s.value(a), raw: (a) => s.raw(a), fmt: (a) => s.getFmt(a), text: (a) => s.text(a),
        sel: { c1: g.c1, r1: g.r1, c2: g.c2, r2: g.r2, addr: rangeStr(g), is: (r) => rangeStr(g) === r.toUpperCase() }
      };
    }

    /* ---------- construção ---------- */
    build() {
      const h = this.host; h.innerHTML = '';
      const root = $('div', 'sv'); this.root = root;
      const tb = $('div', 'sv-toolbar');
      (this.cfg.tools || []).forEach((t) => {
        const d = TOOLS[t]; const b = $('button', 'sv-tool', d.label); b.type = 'button'; b.title = d.title; b.dataset.tool = t;
        b.addEventListener('mousedown', (e) => e.preventDefault());
        b.addEventListener('click', () => this.tool(t));
        tb.appendChild(b);
      });
      const rs = $('button', 'sv-tool sv-reset', '↺ Recomeçar'); rs.type = 'button'; rs.title = 'Volta a planilha ao começo';
      rs.addEventListener('click', () => { this.reset(); this.focus(); });
      tb.appendChild(rs); root.appendChild(tb);

      const fb = $('div', 'sv-formula');
      this.nameBox = $('div', 'sv-name'); this.fbar = $('input', 'sv-fbar'); this.fbar.type = 'text'; this.fbar.spellcheck = false; this.fbar.autocomplete = 'off';
      fb.append(this.nameBox, $('span', 'sv-fx', 'fx'), this.fbar); root.appendChild(fb);
      this.fbar.addEventListener('focus', () => { if (!this.edit) this.startEdit(null, 'bar'); });
      this.fbar.addEventListener('input', () => { if (this.edit) { this.edit.text = this.fbar.value; if (this.cellInput) this.cellInput.value = this.fbar.value; } });
      this.fbar.addEventListener('keydown', (e) => this.editKey(e));

      this.gridWrap = $('div', 'sv-grid'); this.gridWrap.tabIndex = 0;
      this.gridWrap.addEventListener('keydown', (e) => this.gridKey(e));
      root.appendChild(this.gridWrap);
      this.chartHost = $('div', 'sv-chart'); root.appendChild(this.chartHost);
      h.appendChild(root);
      this.render(); this.drawChart();
      document.addEventListener('mouseup', () => { this.dragging = false; });
    }

    render() {
      const { cols, rows } = this.cfg; const s = this.sheet;
      const t = $('table', 'sv-table');
      const cg = $('colgroup'); cg.appendChild($('col')).style.width = '38px';
      for (let c = 1; c <= cols; c++) cg.appendChild($('col')).style.width = ((this.cfg.colW && this.cfg.colW[c - 1]) || 92) + 'px';
      t.appendChild(cg);
      const head = $('tr'); const corner = $('th', 'corner'); head.appendChild(corner);
      for (let c = 1; c <= cols; c++) {
        const th = $('th', 'colh', colName(c)); th.dataset.c = c;
        th.addEventListener('mousedown', (e) => { e.preventDefault(); this.finishEdit(); this.select({ c1: c, c2: c, r1: 1, r2: rows, ac: c, ar: 1 }); this.focus(); });
        head.appendChild(th);
      }
      t.appendChild(head);
      this.tds = {};
      for (let r = 1; r <= rows; r++) {
        const tr = $('tr'); const rh = $('th', 'rowh', r); rh.dataset.r = r;
        rh.addEventListener('mousedown', (e) => { e.preventDefault(); this.finishEdit(); this.select({ c1: 1, c2: cols, r1: r, r2: r, ac: 1, ar: r }); this.focus(); });
        tr.appendChild(rh);
        for (let c = 1; c <= cols; c++) {
          const a = addr(c, r); const td = $('td'); td.dataset.a = a; this.tds[a] = td; this.paintCell(a);
          td.addEventListener('mousedown', (e) => this.cellDown(e, c, r));
          td.addEventListener('mouseover', () => { if (this.dragging && !this.edit) { this.sel.c1 = Math.min(this.sel.ac, c); this.sel.c2 = Math.max(this.sel.ac, c); this.sel.r1 = Math.min(this.sel.ar, r); this.sel.r2 = Math.max(this.sel.ar, r); this.paintSelection(); this.syncBar(); this.emit(); } });
          td.addEventListener('dblclick', () => { if (!this.edit) this.startEdit(null, 'cell'); });
          tr.appendChild(td);
        }
        t.appendChild(tr);
      }
      this.gridWrap.innerHTML = ''; this.gridWrap.appendChild(t); this.table = t;
      this.paintSelection(); this.syncBar();
    }
    paintCell(a) {
      const td = this.tds[a]; if (!td) return;
      const v = this.sheet.value(a), f = this.sheet.getFmt(a);
      td.className = ''; td.textContent = display(v, f);
      if (typeof v === 'number') td.classList.add('num');
      if (v instanceof XL.XLError) td.classList.add('err');
      if (f.bold) td.classList.add('bold');
      if (this.hlSet && this.hlSet.has(a)) td.classList.add('hl');
    }
    paintAll() { for (const a in this.tds) this.paintCell(a); this.paintSelection(); }
    setHighlight(list) {
      this.hlSet = new Set();
      (list || []).forEach((x) => { const g = parseRange(x); if (!g) return; for (let c = g.c1; c <= g.c2; c++) for (let r = g.r1; r <= g.r2; r++) this.hlSet.add(addr(c, r)); });
      this.paintAll();
    }
    paintSelection() {
      const g = this.sel;
      for (const a in this.tds) {
        const p = parseAddr(a); const td = this.tds[a];
        const inSel = p.c >= g.c1 && p.c <= g.c2 && p.r >= g.r1 && p.r <= g.r2;
        td.classList.toggle('sel', inSel && !(g.c1 === g.c2 && g.r1 === g.r2));
        td.classList.toggle('active', p.c === g.ac && p.r === g.ar);
        td.classList.toggle('sel-top', inSel && p.r === g.r1); td.classList.toggle('sel-bottom', inSel && p.r === g.r2);
        td.classList.toggle('sel-left', inSel && p.c === g.c1); td.classList.toggle('sel-right', inSel && p.c === g.c2);
      }
      this.table.querySelectorAll('.colh').forEach((th) => th.classList.toggle('on', +th.dataset.c >= g.c1 && +th.dataset.c <= g.c2));
      this.table.querySelectorAll('.rowh').forEach((th) => th.classList.toggle('on', +th.dataset.r >= g.r1 && +th.dataset.r <= g.r2));
    }
    syncBar() {
      const g = this.sel;
      this.nameBox.textContent = rangeStr(g);
      if (!this.edit) this.fbar.value = this.sheet.raw(addr(g.ac, g.ar));
    }
    focus() { if (!this.edit) this.gridWrap.focus({ preventScroll: true }); }

    /* ---------- seleção ---------- */
    select(g, silent) {
      const { cols, rows } = this.cfg;
      g.c1 = Math.max(1, Math.min(cols, g.c1)); g.c2 = Math.max(1, Math.min(cols, g.c2));
      g.r1 = Math.max(1, Math.min(rows, g.r1)); g.r2 = Math.max(1, Math.min(rows, g.r2));
      g.ac = Math.max(1, Math.min(cols, g.ac)); g.ar = Math.max(1, Math.min(rows, g.ar));
      this.sel = g; this.touched = true; this.paintSelection(); this.syncBar(); if (!silent) this.emit();
    }
    selectRange(str) { const g = parseRange(str); this.select({ c1: g.c1, r1: g.r1, c2: g.c2, r2: g.r2, ac: g.c1, ar: g.r1 }); }
    cellDown(e, c, r) {
      e.preventDefault();
      if (this.edit) {
        const t = this.edit.text;
        if (t[0] === '=' && /[=+\-*/^&(;,<>:]$/.test(t)) { this.insertRef(addr(c, r)); return; }
        this.finishEdit();
      }
      this.dragging = true; this.focus();
      if (e.shiftKey) this.select({ c1: Math.min(this.sel.ac, c), c2: Math.max(this.sel.ac, c), r1: Math.min(this.sel.ar, r), r2: Math.max(this.sel.ar, r), ac: this.sel.ac, ar: this.sel.ar });
      else this.select({ c1: c, c2: c, r1: r, r2: r, ac: c, ar: r });
    }
    insertRef(a) {
      this.edit.text += a;
      this.fbar.value = this.edit.text; if (this.cellInput) { this.cellInput.value = this.edit.text; this.cellInput.focus(); } else this.fbar.focus();
    }

    /* ---------- edição ---------- */
    startEdit(initial, from) {
      const g = this.sel; const a = addr(g.ac, g.ar);
      const text = initial !== null && initial !== undefined ? initial : this.sheet.raw(a);
      this.edit = { a, text, from };
      this.fbar.value = text;
      if (from === 'cell') {
        const td = this.tds[a]; td.textContent = '';
        const inp = $('input', 'sv-cell-input'); inp.type = 'text'; inp.value = text; inp.spellcheck = false; inp.autocomplete = 'off';
        inp.addEventListener('input', () => { this.edit.text = inp.value; this.fbar.value = inp.value; });
        inp.addEventListener('keydown', (e) => this.editKey(e));
        inp.addEventListener('blur', () => { setTimeout(() => { if (this.edit && this.edit.from === 'cell' && document.activeElement !== this.fbar && document.activeElement !== inp) this.finishEdit(); }, 0); });
        td.appendChild(inp); this.cellInput = inp; inp.focus(); const n = inp.value.length; inp.setSelectionRange(n, n);
      } else { this.cellInput = null; this.fbar.focus(); }
    }
    finishEdit(cancel) {
      if (!this.edit) return;
      const { a, text } = this.edit; this.edit = null; this.cellInput = null;
      if (!cancel && text !== this.sheet.raw(a)) { this.sheet.set(a, text); this.touched = true; }
      this.paintAll(); this.syncBar(); this.drawChart(); this.emit();
    }
    editKey(e) {
      if (e.key === 'Enter') { e.preventDefault(); this.finishEdit(); this.move(0, 1); this.focus(); }
      else if (e.key === 'Tab') { e.preventDefault(); this.finishEdit(); this.move(e.shiftKey ? -1 : 1, 0); this.focus(); }
      else if (e.key === 'Escape') { e.preventDefault(); this.finishEdit(true); this.focus(); }
    }
    move(dc, dr, extend) {
      const g = this.sel;
      if (extend) {
        const fc = (g.c1 === g.ac ? g.c2 : g.c1) + dc, fr = (g.r1 === g.ar ? g.r2 : g.r1) + dr;
        const c = Math.max(1, Math.min(this.cfg.cols, fc)), r = Math.max(1, Math.min(this.cfg.rows, fr));
        this.select({ c1: Math.min(g.ac, c), c2: Math.max(g.ac, c), r1: Math.min(g.ar, r), r2: Math.max(g.ar, r), ac: g.ac, ar: g.ar });
      } else {
        const c = Math.max(1, Math.min(this.cfg.cols, g.ac + dc)), r = Math.max(1, Math.min(this.cfg.rows, g.ar + dr));
        this.select({ c1: c, c2: c, r1: r, r2: r, ac: c, ar: r });
      }
    }
    gridKey(e) {
      if (this.edit) return;
      const k = e.key;
      if (k.startsWith('Arrow')) { e.preventDefault(); this.move(k === 'ArrowRight' ? 1 : k === 'ArrowLeft' ? -1 : 0, k === 'ArrowDown' ? 1 : k === 'ArrowUp' ? -1 : 0, e.shiftKey); }
      else if (k === 'Enter') { e.preventDefault(); this.move(0, 1); }
      else if (k === 'Tab') { e.preventDefault(); this.move(e.shiftKey ? -1 : 1, 0); }
      else if (k === 'F2') { e.preventDefault(); this.startEdit(null, 'cell'); }
      else if (k === 'Delete' || k === 'Backspace') { e.preventDefault(); this.clearSel(); }
      else if ((e.ctrlKey || e.metaKey) && k.toLowerCase() === 'd') { e.preventDefault(); this.tool('fill'); }
      else if ((e.ctrlKey || e.metaKey) && k.toLowerCase() === 'b') { e.preventDefault(); this.tool('bold'); }
      else if (k.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) { e.preventDefault(); this.startEdit(k, 'cell'); }
    }
    clearSel() {
      const g = this.sel; for (let c = g.c1; c <= g.c2; c++) for (let r = g.r1; r <= g.r2; r++) this.sheet.set(addr(c, r), '');
      this.touched = true; this.paintAll(); this.syncBar(); this.drawChart(); this.emit();
    }

    /* ---------- ferramentas (também usadas pelos botões "ver resposta") ---------- */
    setCell(a, raw) { this.sheet.set(a, raw); this.touched = true; this.paintAll(); this.syncBar(); this.drawChart(); this.emit(); }
    format(str, key) {
      const g = parseRange(str); const cells = [];
      for (let c = g.c1; c <= g.c2; c++) for (let r = g.r1; r <= g.r2; r++) cells.push(addr(c, r));
      if (key === 'bold') { const all = cells.every((a) => this.sheet.getFmt(a).bold); cells.forEach((a) => { this.sheet.fmt(a).bold = !all; }); }
      else { const all = cells.every((a) => this.sheet.getFmt(a).num === key); cells.forEach((a) => { this.sheet.fmt(a).num = all ? undefined : key; }); }
      this.touched = true; this.paintAll(); this.emit();
    }
    fillDown(str) { this.sheet.fillDown(parseRange(str)); this.touched = true; this.paintAll(); this.emit(); }
    sort(colLetter, dir) {
      const t = this.cfg.table; if (!t) return;
      this.sheet.sortTable(t, colNum(colLetter), dir); this.touched = true; this.paintAll(); this.emit();
    }
    tool(t) {
      const g = this.sel; const str = rangeStr(g);
      if (t === 'bold' || t === 'money' || t === 'percent') this.format(str, t === 'bold' ? 'bold' : t);
      else if (t === 'fill') this.fillDown(str);
      else if (t === 'sortAZ' || t === 'sortZA') {
        const tb = this.cfg.table;
        if (!tb || g.ac < tb.c1 || g.ac > tb.c2 || g.ar < tb.r1 - 1 || g.ar > tb.r2) { this.flash('Clique em uma célula da tabela antes de classificar.'); return; }
        this.sort(colName(g.ac), t === 'sortAZ' ? 'asc' : 'desc');
      } else if (t.startsWith('chart')) this.makeChart(t === 'chartCol' ? 'col' : t === 'chartLine' ? 'line' : 'pie', str);
      this.focus();
    }
    flash(msg) { const f = $('div', 'sv-flash', esc(msg)); this.root.appendChild(f); setTimeout(() => f.remove(), 2200); }

    /* ---------- gráfico ---------- */
    makeChart(type, range) {
      const g = parseRange(range);
      if (g.c1 === g.c2 && g.r1 === g.r2) { this.flash('Selecione os dados (arraste sobre a tabela) antes de inserir o gráfico.'); return; }
      this.chart = { type, range: rangeStr(g) }; this.touched = true; this.drawChart(); this.emit();
    }
    drawChart() {
      const h = this.chartHost; h.innerHTML = ''; if (!this.chart) return;
      const g = parseRange(this.chart.range); const s = this.sheet;
      const val = (c, r) => s.value(addr(c, r));
      const hasHead = (() => { for (let c = g.c1 + 1; c <= g.c2; c++) if (typeof val(c, g.r1) === 'string') return true; return g.c2 === g.c1 ? false : false; })();
      const r0 = hasHead ? g.r1 + 1 : g.r1;
      const labels = []; for (let r = r0; r <= g.r2; r++) labels.push(display(val(g.c1, r)));
      const series = [];
      for (let c = g.c1 + 1; c <= g.c2; c++) { const data = []; for (let r = r0; r <= g.r2; r++) { const v = val(c, r); data.push(typeof v === 'number' ? v : 0); } series.push({ name: hasHead ? display(val(c, g.r1)) : 'Série ' + (c - g.c1), data }); }
      if (!series.length) { h.innerHTML = '<p class="muted">Selecione uma coluna de nomes e uma de números.</p>'; return; }
      h.appendChild(chartSVG(this.chart.type, labels, series));
    }
  }

  /* ---------- desenho de gráficos em SVG ---------- */
  const PAL = ['#107C41', '#2563EB', '#F59E0B', '#DB2777', '#7C3AED', '#0891B2'];
  function chartSVG(type, labels, series) {
    const W = 460, H = 250, svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`); svg.setAttribute('class', 'chart-svg'); svg.setAttribute('role', 'img');
    let out = '';
    const title = series.length === 1 ? series[0].name : 'Comparação';
    out += `<text x="${W / 2}" y="20" class="ch-title" text-anchor="middle">${esc(title)}</text>`;
    if (type === 'pie') {
      const d = series[0].data; const tot = d.reduce((a, b) => a + Math.max(b, 0), 0) || 1; let a0 = -Math.PI / 2; const cx = 150, cy = 140, R = 90;
      d.forEach((v, i) => {
        const a1 = a0 + (Math.max(v, 0) / tot) * Math.PI * 2; const large = a1 - a0 > Math.PI ? 1 : 0;
        const p = (a) => `${cx + R * Math.cos(a)} ${cy + R * Math.sin(a)}`;
        out += d.length === 1 ? `<circle cx="${cx}" cy="${cy}" r="${R}" fill="${PAL[0]}"/>` : `<path d="M${cx} ${cy} L${p(a0)} A${R} ${R} 0 ${large} 1 ${p(a1)} Z" fill="${PAL[i % PAL.length]}" class="ch-slice"/>`;
        out += `<rect x="290" y="${50 + i * 24}" width="12" height="12" rx="2" fill="${PAL[i % PAL.length]}"/><text x="308" y="${61 + i * 24}" class="ch-lab">${esc(labels[i])} (${Math.round(v / tot * 100)}%)</text>`;
        a0 = a1;
      });
    } else {
      const L = 46, T = 36, B = 40, R = 16; const pw = W - L - R, ph = H - T - B;
      const max = Math.max(1, ...series.flatMap((s) => s.data)); const { step, ticks } = niceScale(max); const nice = step * ticks;
      for (let i = 0; i <= ticks; i++) { const y = T + ph - (ph * i) / ticks; out += `<line x1="${L}" x2="${W - R}" y1="${y}" y2="${y}" class="ch-grid"/><text x="${L - 6}" y="${y + 4}" text-anchor="end" class="ch-lab">${fmtK(step * i)}</text>`; }
      const n = labels.length;
      if (type === 'col') {
        const gw = pw / n, bw = Math.min(40, (gw * 0.7) / series.length);
        labels.forEach((lb, i) => {
          series.forEach((s, j) => { const x = L + gw * i + (gw - bw * series.length) / 2 + bw * j; const hh = (s.data[i] / nice) * ph; out += `<rect x="${x}" y="${T + ph - hh}" width="${bw - 2}" height="${hh}" rx="3" fill="${PAL[j % PAL.length]}" class="ch-bar"/>`; });
          out += `<text x="${L + gw * i + gw / 2}" y="${H - B + 16}" text-anchor="middle" class="ch-lab">${esc(lb)}</text>`;
        });
      } else {
        const step = n > 1 ? pw / (n - 1) : 0;
        series.forEach((s, j) => {
          const pts = s.data.map((v, i) => `${L + step * i},${T + ph - (v / nice) * ph}`);
          out += `<polyline points="${pts.join(' ')}" fill="none" stroke="${PAL[j % PAL.length]}" stroke-width="3" stroke-linejoin="round"/>`;
          s.data.forEach((v, i) => { out += `<circle cx="${L + step * i}" cy="${T + ph - (v / nice) * ph}" r="4" fill="${PAL[j % PAL.length]}"/>`; });
        });
        labels.forEach((lb, i) => { out += `<text x="${L + step * i}" y="${H - B + 16}" text-anchor="middle" class="ch-lab">${esc(lb)}</text>`; });
      }
      if (series.length > 1) series.forEach((s, j) => { out += `<rect x="${L + j * 110}" y="${H - 14}" width="10" height="10" rx="2" fill="${PAL[j % PAL.length]}"/><text x="${L + j * 110 + 14}" y="${H - 5}" class="ch-lab">${esc(s.name)}</text>`; });
    }
    svg.innerHTML = out; return svg;
  }
  function niceScale(m) {
    const raw = m / 5, mag = Math.pow(10, Math.floor(Math.log10(raw)));
    const step = [1, 2, 2.5, 5, 10].map((f) => f * mag).find((x) => x >= raw);
    return { step, ticks: Math.ceil(m / step) };
  }
  function niceMax(m) { const p = Math.pow(10, Math.floor(Math.log10(m))); const f = m / p; return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10) * p; }
  function fmtK(v) { return v >= 1000 ? (v / 1000).toLocaleString('pt-BR') + ' mil' : v.toLocaleString('pt-BR'); }

  window.SheetView = SheetView; window.chartSVG = chartSVG;
})();
