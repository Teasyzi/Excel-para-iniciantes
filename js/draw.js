/* Desenhos (SVG) usados nas aulas: grades com setas e legendas, janela do Excel, fluxos */
(function () {
  'use strict';
  const { parseAddr, parseRange, colName } = XL;
  const esc = (s) => String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
  const DEFS = '<defs><marker id="ah" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" class="d-head"/></marker></defs>';
  const lines = (txt, x, y, anchor, cls) => {
    const parts = String(txt).split('\n');
    const dy0 = parts.length > 1 ? -((parts.length - 1) * 8) : 0;
    return `<text x="${x}" y="${y + dy0 + 5}" text-anchor="${anchor}" class="${cls}">` + parts.map((p, i) => `<tspan x="${x}" dy="${i ? 16 : 0}">${esc(p)}</tspan>`).join('') + '</text>';
  };
  const isNum = (t) => /^-?[\d.,]+%?$/.test(String(t).trim()) || /^R\$/.test(String(t));

  /* grade com realces e legendas */
  function gridParts(o) {
    const cols = o.cols || 4, rows = o.rows || 4, w = o.w || 74, h = o.h || 28, hdrW = 30;
    const notes = o.notes || [];
    const has = (s) => notes.some((n) => (n.side || 'right') === s);
    const padL = has('left') ? 150 : 8, padR = has('right') ? 160 : 8, padT = has('top') ? 52 : 8, padB = has('bottom') ? 52 : 8;
    const cw = []; for (let c = 1; c <= cols; c++) cw[c] = w;
    for (const a in (o.cells || {})) { const p0 = parseAddr(a); if (!p0 || p0.c > cols) continue; const v0 = o.cells[a]; const t0 = String(v0 && typeof v0 === 'object' ? v0.t : v0); cw[p0.c] = Math.min(230, Math.max(cw[p0.c], t0.length * 7.9 + 16)); }
    const colX = [0]; let acc = padL + hdrW; for (let c = 1; c <= cols; c++) { colX[c] = acc; acc += cw[c]; }
    const X = (c) => c > cols ? acc : colX[c], Y = (r) => padT + h + (r - 1) * h;
    const W = acc + padR, H = padT + h + rows * h + padB;
    let s = '';
    const hlCols = new Set(), hlRows = new Set();
    [...(o.hl || []), ...(o.hl2 || [])].forEach((a) => { const g = parseRange(a); for (let c = g.c1; c <= g.c2; c++) hlCols.add(c); for (let r = g.r1; r <= g.r2; r++) hlRows.add(r); });
    s += `<rect x="${padL}" y="${padT}" width="${hdrW}" height="${h}" class="d-hdr"/>`;
    for (let c = 1; c <= cols; c++) s += `<rect x="${X(c)}" y="${padT}" width="${cw[c]}" height="${h}" class="d-hdr${hlCols.has(c) ? ' on' : ''}"/>` + lines(colName(c), X(c) + cw[c] / 2, padT + h / 2, 'middle', 'd-hl-t');
    for (let r = 1; r <= rows; r++) s += `<rect x="${padL}" y="${Y(r)}" width="${hdrW}" height="${h}" class="d-hdr${hlRows.has(r) ? ' on' : ''}"/>` + lines(r, padL + hdrW / 2, Y(r) + h / 2, 'middle', 'd-hl-t');
    for (let c = 1; c <= cols; c++) for (let r = 1; r <= rows; r++) s += `<rect x="${X(c)}" y="${Y(r)}" width="${cw[c]}" height="${h}" class="d-cell"/>`;
    const cells = o.cells || {};
    for (const a in cells) {
      const p = parseAddr(a); if (!p || p.c > cols || p.r > rows) continue;
      let v = cells[a], cls = 'd-txt'; if (v && typeof v === 'object') { cls += ' ' + (v.cls || ''); v = v.t; }
      v = String(v); const num = isNum(v) && v[0] !== '=';
      if ((o.bold || []).includes(a)) cls += ' b';
      s += `<text x="${num ? X(p.c) + cw[p.c] - 7 : X(p.c) + 7}" y="${Y(p.r) + h / 2 + 5}" text-anchor="${num ? 'end' : 'start'}" class="${cls}">${esc(v)}</text>`;
    }
    const box = (a, cls) => { const g = parseRange(a); return `<rect x="${X(g.c1)}" y="${Y(g.r1)}" width="${X(g.c2 + 1) - X(g.c1)}" height="${(g.r2 - g.r1 + 1) * h}" class="${cls}" rx="2"/>`; };
    (o.hl2 || []).forEach((a) => { s += box(a, 'd-hl2'); });
    (o.hl || []).forEach((a) => { s += box(a, 'd-hl'); });
    notes.forEach((n) => {
      const g = parseRange(n.at); const side = n.side || 'right'; const cls = n.cls === 'b' ? 'd-note b' : 'd-note';
      const x1 = X(g.c1), x2 = X(g.c2 + 1), y1 = Y(g.r1), y2 = Y(g.r2) + h, cx = (x1 + x2) / 2, cy = (y1 + y2) / 2;
      const line = (a, b, c, d) => `<line x1="${a}" y1="${b}" x2="${c}" y2="${d}" class="d-line${n.cls === 'b' ? ' b' : ''}" marker-end="url(#ah)"/>`;
      if (side === 'right') s += line(W - padR + 40 > x2 + 40 ? x2 + 46 : x2 + 46, cy, x2 + 3, cy) + lines(n.text, x2 + 52, cy, 'start', cls);
      if (side === 'left') s += line(x1 - 46, cy, x1 - 3, cy) + lines(n.text, x1 - 52, cy, 'end', cls);
      if (side === 'top') s += line(cx, padT - 18 + (padT > 8 ? 0 : 0) + 0, cx, y1 - 3) + lines(n.text, cx, 16, 'middle', cls);
      if (side === 'bottom') s += line(cx, H - 36, cx, y2 + 3) + lines(n.text, cx, H - 14, 'middle', cls);
    });
    return { w: W, h: H, body: s };
  }
  function wrap(w, h, body) { return `<svg viewBox="0 0 ${w} ${h}" class="draw" role="img" xmlns="http://www.w3.org/2000/svg">${DEFS}${body}</svg>`; }
  function grid(o) { const p = gridParts(o); return wrap(p.w, p.h, p.body); }

  /* duas grades lado a lado com uma seta no meio */
  function pair(a, b, label) {
    const A = gridParts(a), B = gridParts(b); const gap = 90; const H = Math.max(A.h, B.h);
    const body = `<g>${A.body}</g><g transform="translate(${A.w + gap},0)">${B.body}</g>` +
      `<line x1="${A.w + 14}" y1="${H / 2}" x2="${A.w + gap - 14}" y2="${H / 2}" class="d-line" marker-end="url(#ah)"/>` + (label ? lines(label, A.w + gap / 2, H / 2 - 22, 'middle', 'd-note') : '');
    return wrap(A.w + gap + B.w, H, body);
  }

  /* caixas ligadas por setas (fluxo) */
  function flow(items, o) {
    o = o || {}; const bw = o.bw || 130, bh = o.bh || 64, gap = o.gap || 44; const W = items.length * bw + (items.length - 1) * gap + 16;
    let s = '';
    items.forEach((it, i) => {
      const x = 8 + i * (bw + gap);
      s += `<rect x="${x}" y="${(o.h || 100) / 2 - bh / 2}" width="${bw}" height="${bh}" rx="10" class="d-box ${it.cls || ''}"/>` + lines(it.t, x + bw / 2, (o.h || 100) / 2, 'middle', 'd-box-t');
      if (i < items.length - 1) s += `<line x1="${x + bw + 6}" y1="${(o.h || 100) / 2}" x2="${x + bw + gap - 6}" y2="${(o.h || 100) / 2}" class="d-line" marker-end="url(#ah)"/>` + (it.arrow ? lines(it.arrow, x + bw + gap / 2, (o.h || 100) / 2 - 22, 'middle', 'd-note') : '');
    });
    return wrap(W, o.h || 100, s);
  }

  /* janela do Excel com partes numeradas */
  function windowDraw() {
    let s = '';
    s += '<rect x="150" y="4" width="440" height="300" rx="8" class="d-win"/>';
    s += '<rect x="150" y="4" width="440" height="26" rx="8" class="d-title"/><rect x="150" y="18" width="440" height="12" class="d-title"/>';
    s += '<text x="164" y="22" class="d-title-t">Pasta1 - Excel</text>';
    ['Arquivo', 'Página Inicial', 'Inserir', 'Fórmulas', 'Dados'].forEach((t, i) => { s += `<text x="${162 + i * 78}" y="48" class="d-tab-t${i === 1 ? ' on' : ''}">${t}</text>`; });
    s += '<rect x="154" y="56" width="432" height="36" rx="4" class="d-ribbon"/>';
    [0, 1, 2, 3, 4, 5, 6].forEach((i) => { s += `<rect x="${164 + i * 40}" y="63" width="30" height="22" rx="4" class="d-btn"/>`; });
    s += '<rect x="154" y="98" width="70" height="18" class="d-cell"/><text x="162" y="111" class="d-txt">B3</text>';
    s += '<text x="232" y="111" class="d-fx">fx</text><rect x="248" y="98" width="338" height="18" class="d-cell"/>';
    const gx = 154, gy = 122, cw = 66, rh = 22, hw = 26;
    s += `<rect x="${gx}" y="${gy}" width="${hw}" height="${rh}" class="d-hdr"/>`;
    for (let c = 0; c < 6; c++) s += `<rect x="${gx + hw + c * cw}" y="${gy}" width="${cw}" height="${rh}" class="d-hdr${c === 1 ? ' on' : ''}"/><text x="${gx + hw + c * cw + cw / 2}" y="${gy + 15}" text-anchor="middle" class="d-hl-t">${colName(c + 1)}</text>`;
    for (let r = 0; r < 6; r++) {
      s += `<rect x="${gx}" y="${gy + rh * (r + 1)}" width="${hw}" height="${rh}" class="d-hdr${r === 2 ? ' on' : ''}"/><text x="${gx + hw / 2}" y="${gy + rh * (r + 1) + 15}" text-anchor="middle" class="d-hl-t">${r + 1}</text>`;
      for (let c = 0; c < 6; c++) s += `<rect x="${gx + hw + c * cw}" y="${gy + rh * (r + 1)}" width="${cw}" height="${rh}" class="d-cell"/>`;
    }
    s += `<rect x="${gx + hw + cw}" y="${gy + rh * 3}" width="${cw}" height="${rh}" class="d-hl"/>`;
    s += '<rect x="154" y="282" width="432" height="18" class="d-ribbon"/><rect x="162" y="284" width="56" height="14" rx="3" class="d-tabsheet"/><text x="190" y="295" text-anchor="middle" class="d-txt" style="font-size:10px">Plan1</text><text x="232" y="296" class="d-txt" style="font-size:13px">＋</text>';
    const tag = (n, x, y, tx, ty, txt, anchor) => `<line x1="${x}" y1="${y}" x2="${tx}" y2="${ty}" class="d-line"/><circle cx="${x}" cy="${y}" r="3.5" class="d-dot"/><circle cx="${anchor === 'end' ? tx + 14 : tx - 14}" cy="${ty}" r="11" class="d-num"/><text x="${anchor === 'end' ? tx + 14 : tx - 14}" y="${ty + 4}" text-anchor="middle" class="d-num-t">${n}</text>` + lines(txt, anchor === 'end' ? tx + 32 : tx - 32, ty, anchor === 'end' ? 'start' : 'end', 'd-note lg');
    // lado esquerdo
    s += tag(1, 210, 70, 128, 66, 'Faixa de\nopções', 'start');
    s += tag(2, 190, 107, 128, 107, 'Caixa\nde Nome', 'start');
    s += tag(3, 160, 190, 128, 190, 'Número\nda linha', 'start');
    s += tag(4, 190, 291, 128, 276, 'Abas das\nplanilhas', 'start');
    // lado direito
    s += tag(5, 420, 107, 612, 80, 'Barra de\nfórmulas', 'end');
    s += tag(6, 316, 135, 612, 135, 'Letra da\ncoluna', 'end');
    s += tag(7, 275, 190, 612, 190, 'Célula ativa\n(onde você\nestá)', 'end');
    return wrap(760, 310, s);
  }

  window.D = { grid, pair, flow, window: windowDraw };
})();
