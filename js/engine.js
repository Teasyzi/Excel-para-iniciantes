/* Motor de planilha: guarda células, calcula fórmulas em português (SOMA, SE, PROCV...) */
(function (root) {
  'use strict';

  const strip = (s) => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase();
  const colNum = (s) => { let n = 0; for (const ch of s.toUpperCase()) n = n * 26 + ch.charCodeAt(0) - 64; return n; };
  const colName = (n) => { let s = ''; while (n > 0) { const m = (n - 1) % 26; s = String.fromCharCode(65 + m) + s; n = Math.floor((n - 1) / 26); } return s; };
  const addr = (c, r) => colName(c) + r;
  const parseAddr = (a) => { const m = /^\$?([A-Za-z]{1,2})\$?(\d+)$/.exec(a); return m ? { c: colNum(m[1]), r: +m[2] } : null; };
  const parseRange = (s) => {
    const p = String(s).split(':');
    const a = parseAddr(p[0]); const b = parseAddr(p[1] || p[0]);
    if (!a || !b) return null;
    return { c1: Math.min(a.c, b.c), r1: Math.min(a.r, b.r), c2: Math.max(a.c, b.c), r2: Math.max(a.r, b.r) };
  };
  const rangeStr = (g) => (g.c1 === g.c2 && g.r1 === g.r2) ? addr(g.c1, g.r1) : addr(g.c1, g.r1) + ':' + addr(g.c2, g.r2);

  class XLError { constructor(code) { this.code = code; } toString() { return this.code; } }
  const err = (c) => new XLError(c);
  const isErr = (v) => v instanceof XLError;
  const isRange = (v) => v && v.range === true;

  /* ---------- entrada digitada -> valor ---------- */
  function parseInput(raw) {
    const t = raw.trim();
    if (/^-?\d+([.,]\d+)?$/.test(t)) return parseFloat(t.replace(',', '.'));
    if (/^-?\d+([.,]\d+)?%$/.test(t)) return parseFloat(t.slice(0, -1).replace(',', '.')) / 100;
    return raw;
  }

  /* ---------- tokenizador ---------- */
  function tokenize(src) {
    const out = []; let i = 0;
    while (i < src.length) {
      const rest = src.slice(i); let m;
      if ((m = /^\s+/.exec(rest))) { i += m[0].length; continue; }
      if ((m = /^"((?:[^"]|"")*)"/.exec(rest))) { out.push({ t: 'str', v: m[1].replace(/""/g, '"') }); i += m[0].length; continue; }
      if ((m = /^\d+(?:[.,]\d+)?/.exec(rest))) { out.push({ t: 'num', v: parseFloat(m[0].replace(',', '.')) }); i += m[0].length; continue; }
      if ((m = /^\$?[A-Za-z]{1,2}\$?\d+(?![\w.(])/.exec(rest))) { out.push({ t: 'ref', v: m[0] }); i += m[0].length; continue; }
      if ((m = /^[A-Za-zÀ-ÿ_][A-Za-zÀ-ÿ0-9_.]*/.exec(rest))) { out.push({ t: 'id', v: m[0] }); i += m[0].length; continue; }
      if ((m = /^(<=|>=|<>|[-+*/^&=<>();,:%])/.exec(rest))) { out.push({ t: 'op', v: m[0] }); i += m[0].length; continue; }
      throw new Error('char');
    }
    return out;
  }

  /* ---------- parser ---------- */
  function parse(src) {
    const toks = tokenize(src); let p = 0;
    const peek = () => toks[p]; const next = () => toks[p++];
    const isOp = (v) => peek() && peek().t === 'op' && peek().v === v;
    function expr() { return cmp(); }
    function cmp() {
      let l = cat();
      while (peek() && peek().t === 'op' && ['=', '<>', '<', '>', '<=', '>='].includes(peek().v)) { const op = next().v; l = { k: 'bin', op, l, r: cat() }; }
      return l;
    }
    function cat() { let l = add(); while (isOp('&')) { next(); l = { k: 'bin', op: '&', l, r: add() }; } return l; }
    function add() { let l = mul(); while (isOp('+') || isOp('-')) { const op = next().v; l = { k: 'bin', op, l, r: mul() }; } return l; }
    function mul() { let l = pow(); while (isOp('*') || isOp('/')) { const op = next().v; l = { k: 'bin', op, l, r: pow() }; } return l; }
    function pow() { let l = unary(); while (isOp('^')) { next(); l = { k: 'bin', op: '^', l, r: unary() }; } return l; }
    function unary() {
      if (isOp('-')) { next(); return { k: 'un', op: '-', x: unary() }; }
      if (isOp('+')) { next(); return unary(); }
      return postfix();
    }
    function postfix() { let x = primary(); while (isOp('%')) { next(); x = { k: 'pct', x }; } return x; }
    function primary() {
      const t = next(); if (!t) throw new Error('fim');
      if (t.t === 'num') return { k: 'num', v: t.v };
      if (t.t === 'str') return { k: 'str', v: t.v };
      if (t.t === 'ref') {
        if (isOp(':')) { next(); const t2 = next(); if (!t2 || t2.t !== 'ref') throw new Error('range'); return { k: 'range', a: parseAddr(t.v), b: parseAddr(t2.v) }; }
        return { k: 'ref', a: parseAddr(t.v) };
      }
      if (t.t === 'id') {
        if (isOp('(')) {
          next(); const args = [];
          if (isOp(')')) { next(); return { k: 'call', name: strip(t.v), args }; }
          for (;;) {
            if (isOp(';') || isOp(',')) { args.push({ k: 'empty' }); next(); continue; }
            args.push(expr());
            if (isOp(';') || isOp(',')) { next(); continue; }
            if (isOp(')')) { next(); break; }
            throw new Error('arg');
          }
          return { k: 'call', name: strip(t.v), args };
        }
        const u = strip(t.v);
        if (u === 'VERDADEIRO') return { k: 'bool', v: true };
        if (u === 'FALSO') return { k: 'bool', v: false };
        return { k: 'name', v: t.v };
      }
      if (t.t === 'op' && t.v === '(') { const e = expr(); if (!isOp(')')) throw new Error('paren'); next(); return e; }
      throw new Error('tok');
    }
    const ast = expr();
    if (p < toks.length) throw new Error('sobra');
    return ast;
  }
  const astCache = new Map();
  const getAst = (f) => { if (!astCache.has(f)) { try { astCache.set(f, parse(f)); } catch (e) { astCache.set(f, null); } } return astCache.get(f); };

  /* ---------- coerção ---------- */
  function toNum(v) {
    if (isErr(v)) return v;
    if (isRange(v)) return err('#VALOR!');
    if (v === null || v === '') return 0;
    if (typeof v === 'number') return v;
    if (typeof v === 'boolean') return v ? 1 : 0;
    const t = String(v).trim().replace(',', '.');
    if (t !== '' && !isNaN(Number(t))) return Number(t);
    return err('#VALOR!');
  }
  function toStr(v) {
    if (isErr(v)) return v;
    if (v === null) return '';
    if (typeof v === 'boolean') return v ? 'VERDADEIRO' : 'FALSO';
    if (typeof v === 'number') return fmtGeneral(v);
    return String(v);
  }
  function toBool(v) {
    if (isErr(v)) return v;
    if (isRange(v)) return err('#VALOR!');
    if (typeof v === 'boolean') return v;
    if (v === null) return false;
    if (typeof v === 'number') return v !== 0;
    const u = strip(v); if (u === 'VERDADEIRO') return true; if (u === 'FALSO') return false;
    return err('#VALOR!');
  }
  const fmtGeneral = (n) => {
    if (!isFinite(n)) return '#NÚM!';
    const s = String(parseFloat(n.toPrecision(12)));
    return s.replace('.', ',');
  };

  function compare(a, b) {
    const rank = (v) => v === null ? 0 : typeof v === 'number' ? 1 : typeof v === 'string' ? 2 : 3;
    if (a === null) a = typeof b === 'string' ? '' : (typeof b === 'boolean' ? false : 0);
    if (b === null) b = typeof a === 'string' ? '' : (typeof a === 'boolean' ? false : 0);
    const ra = rank(a), rb = rank(b);
    if (ra !== rb) return ra - rb;
    if (typeof a === 'string') { const x = a.toLowerCase(), y = b.toLowerCase(); return x < y ? -1 : x > y ? 1 : 0; }
    return a < b ? -1 : a > b ? 1 : 0;
  }

  /* ---------- critérios (CONT.SE, SOMASE) ---------- */
  function critFn(c) {
    if (isErr(c)) return () => false;
    let op = '=', s;
    if (typeof c === 'number' || typeof c === 'boolean') s = c; else {
      s = String(c === null ? '' : c);
      const m = /^(<=|>=|<>|<|>|=)([\s\S]*)$/.exec(s);
      if (m) { op = m[1]; s = m[2]; }
    }
    let n = null;
    if (typeof s === 'number') n = s;
    else if (typeof s === 'string' && s.trim() !== '' && !isNaN(Number(s.replace(',', '.')))) n = Number(s.replace(',', '.'));
    return (v) => {
      if (isErr(v)) return false;
      if (n !== null) {
        if (typeof v !== 'number') return op === '<>';
        return op === '=' ? v === n : op === '<>' ? v !== n : op === '<' ? v < n : op === '>' ? v > n : op === '<=' ? v <= n : v >= n;
      }
      const str = typeof s === 'boolean' ? s : String(s);
      if (typeof str === 'boolean') return op === '<>' ? v !== str : v === str;
      if (op === '=' || op === '<>') {
        const re = new RegExp('^' + str.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*').replace(/\?/g, '.') + '$', 'i');
        const hit = (typeof v === 'string' || (v === null && str === '')) && re.test(v === null ? '' : v);
        return op === '=' ? hit : !hit;
      }
      if (typeof v !== 'string') return false;
      const x = v.toLowerCase(), y = str.toLowerCase();
      return op === '<' ? x < y : op === '>' ? x > y : op === '<=' ? x <= y : x >= y;
    };
  }

  /* ---------- funções ---------- */
  const flat = (v) => isRange(v) ? v.rows.flat() : [v];
  function nums(args) { // números de intervalos e valores diretos
    const out = [];
    for (const a of args) {
      if (isRange(a)) { for (const v of a.rows.flat()) { if (isErr(v)) return v; if (typeof v === 'number') out.push(v); } }
      else { const n = toNum(a); if (isErr(n)) return n; out.push(n); }
    }
    return out;
  }
  const F = {};
  F.SOMA = (a) => { const n = nums(a); return isErr(n) ? n : n.reduce((x, y) => x + y, 0); };
  F.MEDIA = (a) => { const n = nums(a); if (isErr(n)) return n; return n.length ? n.reduce((x, y) => x + y, 0) / n.length : err('#DIV/0!'); };
  F.MAXIMO = (a) => { const n = nums(a); return isErr(n) ? n : n.length ? Math.max(...n) : 0; };
  F.MINIMO = (a) => { const n = nums(a); return isErr(n) ? n : n.length ? Math.min(...n) : 0; };
  F['CONT.NUM'] = (a) => a.reduce((s, x) => s + flat(x).filter((v) => typeof v === 'number').length, 0);
  F['CONT.VALORES'] = (a) => a.reduce((s, x) => s + flat(x).filter((v) => v !== null && v !== '').length, 0);
  F['CONT.VAZIO'] = (a) => a.reduce((s, x) => s + flat(x).filter((v) => v === null || v === '').length, 0);
  F['CONT.SE'] = ([r, c]) => { if (!isRange(r)) return err('#VALOR!'); const f = critFn(c); return r.rows.flat().filter(f).length; };
  F.SOMASE = ([r, c, s]) => {
    if (!isRange(r)) return err('#VALOR!'); const f = critFn(c); const src = isRange(s) ? s.rows.flat() : r.rows.flat();
    return r.rows.flat().reduce((t, v, i) => t + (f(v) && typeof src[i] === 'number' ? src[i] : 0), 0);
  };
  F.MEDIASE = ([r, c, s]) => {
    if (!isRange(r)) return err('#VALOR!'); const f = critFn(c); const src = isRange(s) ? s.rows.flat() : r.rows.flat();
    const sel = r.rows.flat().map((v, i) => f(v) && typeof src[i] === 'number' ? src[i] : null).filter((x) => x !== null);
    return sel.length ? sel.reduce((a, b) => a + b, 0) / sel.length : err('#DIV/0!');
  };
  F['CONT.SES'] = (a) => {
    const fs = []; for (let i = 0; i + 1 < a.length; i += 2) fs.push([a[i].rows.flat(), critFn(a[i + 1])]);
    if (!fs.length) return err('#VALOR!');
    return fs[0][0].filter((_, i) => fs.every(([arr, f]) => f(arr[i]))).length;
  };
  F.SOMASES = (a) => {
    const src = a[0].rows.flat(); const fs = [];
    for (let i = 1; i + 1 < a.length; i += 2) fs.push([a[i].rows.flat(), critFn(a[i + 1])]);
    return src.reduce((t, v, i) => t + (fs.every(([arr, f]) => f(arr[i])) && typeof v === 'number' ? v : 0), 0);
  };
  F.E = (a) => { let r = true; for (const x of a.flatMap(flat)) { const b = toBool(x); if (isErr(b)) return b; r = r && b; } return r; };
  F.OU = (a) => { let r = false; for (const x of a.flatMap(flat)) { const b = toBool(x); if (isErr(b)) return b; r = r || b; } return r; };
  F.NAO = ([x]) => { const b = toBool(x); return isErr(b) ? b : !b; };
  F.ABS = ([x]) => { const n = toNum(x); return isErr(n) ? n : Math.abs(n); };
  F.ARRED = ([x, d]) => { const n = toNum(x), k = toNum(d === undefined ? 0 : d); if (isErr(n)) return n; if (isErr(k)) return k; const m = Math.pow(10, k); return Math.round((n + Number.EPSILON * Math.sign(n)) * m) / m; };
  F.ESQUERDA = ([t, n]) => { const s = toStr(t); if (isErr(s)) return s; return s.slice(0, n === undefined ? 1 : toNum(n)); };
  F.DIREITA = ([t, n]) => { const s = toStr(t); if (isErr(s)) return s; const k = n === undefined ? 1 : toNum(n); return k === 0 ? '' : s.slice(-k); };
  F.MAIUSCULA = ([t]) => { const s = toStr(t); return isErr(s) ? s : s.toUpperCase(); };
  F.MINUSCULA = ([t]) => { const s = toStr(t); return isErr(s) ? s : s.toLowerCase(); };
  F['PRI.MAIUSCULA'] = ([t]) => { const s = toStr(t); return isErr(s) ? s : s.toLowerCase().replace(/(^|\s)(\S)/g, (m, a, b) => a + b.toUpperCase()); };
  F.ARRUMAR = ([t]) => { const s = toStr(t); return isErr(s) ? s : s.trim().replace(/\s+/g, ' '); };
  F['NUM.CARACT'] = ([t]) => { const s = toStr(t); return isErr(s) ? s : s.length; };
  F.CONCATENAR = (a) => { let o = ''; for (const x of a) { const s = toStr(x); if (isErr(s)) return s; o += s; } return o; };
  F.CONCAT = (a) => { let o = ''; for (const x of a.flatMap(flat)) { const s = toStr(x); if (isErr(s)) return s; o += s; } return o; };
  F.SOMARPRODUTO = (a) => {
    const arrs = a.map((x) => flat(x)); const len = arrs[0].length;
    if (arrs.some((x) => x.length !== len)) return err('#VALOR!');
    let t = 0; for (let i = 0; i < len; i++) { let p = 1; for (const x of arrs) p *= typeof x[i] === 'number' ? x[i] : 0; t += p; }
    return t;
  };
  F.CORRESP = ([v, m, tipo]) => {
    const arr = flat(m); const k = tipo === undefined ? 1 : toNum(tipo);
    if (k === 0) { const i = arr.findIndex((x) => x !== null && compare(x, v) === 0); return i < 0 ? err('#N/D') : i + 1; }
    let best = -1;
    arr.forEach((x, i) => { if (x === null) return; const c = compare(x, v); if (k >= 1 ? c <= 0 : c >= 0) { if (best < 0 || (k >= 1 ? compare(x, arr[best]) >= 0 : compare(x, arr[best]) <= 0)) best = i; } });
    return best < 0 ? err('#N/D') : best + 1;
  };
  F.INDICE = ([m, l, c]) => {
    if (!isRange(m)) return m;
    const R = m.rows.length, C = m.rows[0].length; let li = toNum(l === undefined ? 1 : l), ci = c === undefined ? null : toNum(c);
    if (isErr(li)) return li; if (ci !== null && isErr(ci)) return ci;
    if (ci === null) { if (R === 1) { ci = li; li = 1; } else ci = 1; }
    if (li < 1 || li > R || ci < 1 || ci > C) return err('#REF!');
    const v = m.rows[li - 1][ci - 1]; return v === null ? 0 : v;
  };
  F.PROCV = ([v, t, col, aprox]) => {
    if (!isRange(t)) return err('#VALOR!'); const ci = toNum(col); if (isErr(ci)) return ci;
    if (ci < 1 || ci > t.rows[0].length) return err('#REF!');
    const exact = aprox !== undefined && toBool(aprox) === false;
    if (exact) { const row = t.rows.find((r) => r[0] !== null && compare(r[0], v) === 0); if (!row) return err('#N/D'); return row[ci - 1] === null ? 0 : row[ci - 1]; }
    let best = null; for (const r of t.rows) { if (r[0] === null) continue; if (compare(r[0], v) <= 0) best = r; else break; }
    if (!best) return err('#N/D'); return best[ci - 1] === null ? 0 : best[ci - 1];
  };
  F.PROCX = ([v, a, r, nf]) => {
    const A = flat(a), Rr = flat(r); const i = A.findIndex((x) => x !== null && compare(x, v) === 0);
    if (i < 0) return nf !== undefined ? nf : err('#N/D');
    return Rr[i] === null ? 0 : Rr[i];
  };

  /* ---------- avaliação ---------- */
  function evalNode(n, sheet) {
    switch (n.k) {
      case 'num': case 'str': case 'bool': return n.v;
      case 'empty': return null;
      case 'name': return err('#NOME?');
      case 'ref': return sheet.value(addr(n.a.c, n.a.r));
      case 'range': {
        const g = { c1: Math.min(n.a.c, n.b.c), c2: Math.max(n.a.c, n.b.c), r1: Math.min(n.a.r, n.b.r), r2: Math.max(n.a.r, n.b.r) };
        const rows = []; for (let r = g.r1; r <= g.r2; r++) { const row = []; for (let c = g.c1; c <= g.c2; c++) row.push(sheet.value(addr(c, r))); rows.push(row); }
        return { range: true, rows };
      }
      case 'un': { const x = toNum(evalNode(n.x, sheet)); return isErr(x) ? x : -x; }
      case 'pct': { const x = toNum(evalNode(n.x, sheet)); return isErr(x) ? x : x / 100; }
      case 'bin': {
        let l = evalNode(n.l, sheet), r = evalNode(n.r, sheet);
        if (isErr(l)) return l; if (isErr(r)) return r;
        if (isRange(l) || isRange(r)) return err('#VALOR!');
        if (n.op === '&') return toStr(l) + toStr(r);
        if (['=', '<>', '<', '>', '<=', '>='].includes(n.op)) {
          const c = compare(l, r);
          return n.op === '=' ? c === 0 : n.op === '<>' ? c !== 0 : n.op === '<' ? c < 0 : n.op === '>' ? c > 0 : n.op === '<=' ? c <= 0 : c >= 0;
        }
        const a = toNum(l), b = toNum(r); if (isErr(a)) return a; if (isErr(b)) return b;
        switch (n.op) {
          case '+': return a + b; case '-': return a - b; case '*': return a * b;
          case '/': return b === 0 ? err('#DIV/0!') : a / b;
          case '^': return Math.pow(a, b);
        }
        return err('#VALOR!');
      }
      case 'call': {
        if (n.name === 'SE') {
          const c = toBool(evalNode(n.args[0] || { k: 'empty' }, sheet)); if (isErr(c)) return c;
          if (c) return n.args[1] ? evalNode(n.args[1], sheet) : 0;
          return n.args[2] ? evalNode(n.args[2], sheet) : false;
        }
        if (n.name === 'SEERRO') {
          const v = evalNode(n.args[0], sheet); return isErr(v) ? (n.args[1] ? evalNode(n.args[1], sheet) : null) : v;
        }
        const fn = F[n.name]; if (!fn) return err('#NOME?');
        const args = n.args.map((a) => evalNode(a, sheet));
        for (const a of args) if (isErr(a)) return a;
        try { const r = fn(args); return r === undefined ? err('#VALOR!') : r; } catch (e) { return err('#VALOR!'); }
      }
    }
    return err('#VALOR!');
  }

  /* ---------- formatação para exibir ---------- */
  function display(v, fmt) {
    if (v === null || v === undefined) return '';
    if (isErr(v)) return v.code;
    if (typeof v === 'boolean') return v ? 'VERDADEIRO' : 'FALSO';
    if (typeof v === 'number') {
      if (fmt && fmt.num === 'money') return 'R$ ' + v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      if (fmt && fmt.num === 'percent') return (v * 100).toLocaleString('pt-BR', { maximumFractionDigits: 2 }) + '%';
      return fmtGeneral(v);
    }
    return String(v);
  }

  /* ---------- deslocar referências (copiar/preencher) ---------- */
  function shiftFormula(f, dc, dr) {
    return f.split(/("(?:[^"]|"")*")/).map((part, i) => i % 2 ? part : part.replace(/(?<![\w.$])(\$?)([A-Za-z]{1,2})(\$?)(\d+)(?![\w.(])/g, (m, a1, col, a2, row) => {
      let c = colNum(col), r = +row;
      if (!a1) c += dc; if (!a2) r += dr;
      if (c < 1 || r < 1) return '#REF!';
      return a1 + colName(c) + a2 + r;
    })).join('');
  }

  /* ---------- a planilha ---------- */
  class Sheet {
    constructor(data) {
      this.raws = {}; this.fmts = {}; this.cache = new Map(); this.stack = new Set();
      for (const k in (data || {})) this.set(k, data[k], true);
    }
    set(a, raw, silent) {
      a = a.toUpperCase(); raw = raw === null || raw === undefined ? '' : String(raw);
      this.cache = new Map();
      if (raw === '') { delete this.raws[a]; return; }
      this.raws[a] = raw;
      if (/^-?\d+([.,]\d+)?%$/.test(raw.trim())) this.fmt(a).num = 'percent';
    }
    raw(a) { return this.raws[a.toUpperCase()] === undefined ? '' : this.raws[a.toUpperCase()]; }
    fmt(a) { a = a.toUpperCase(); return this.fmts[a] || (this.fmts[a] = {}); }
    getFmt(a) { return this.fmts[a.toUpperCase()] || {}; }
    value(a) {
      a = a.toUpperCase();
      if (this.cache.has(a)) return this.cache.get(a);
      const raw = this.raws[a]; let v;
      if (raw === undefined) v = null;
      else if (raw[0] === '=') {
        if (this.stack.has(a)) return err('#REF!');
        this.stack.add(a);
        const ast = getAst(raw.slice(1));
        v = ast ? evalNode(ast, this) : err('#NOME?');
        if (isRange(v)) v = err('#VALOR!');
        this.stack.delete(a);
      } else v = parseInput(raw);
      this.cache.set(a, v); return v;
    }
    text(a) { return display(this.value(a), this.getFmt(a)); }
    /* preencher para baixo (Ctrl+D) */
    fillDown(g) {
      for (let c = g.c1; c <= g.c2; c++) {
        const src = addr(c, g.r1); const raw = this.raw(src);
        for (let r = g.r1 + 1; r <= g.r2; r++) {
          this.set(addr(c, r), raw[0] === '=' ? shiftFormula(raw, 0, r - g.r1) : raw);
          const f = this.getFmt(src); this.fmts[addr(c, r)] = Object.assign({}, f);
        }
      }
    }
    /* ordenar linhas de uma tabela por uma coluna */
    sortTable(t, col, dir) {
      const rows = [];
      for (let r = t.r1; r <= t.r2; r++) {
        const cells = []; for (let c = t.c1; c <= t.c2; c++) cells.push({ raw: this.raw(addr(c, r)), fmt: Object.assign({}, this.getFmt(addr(c, r))) });
        rows.push({ cells, key: this.value(addr(col, r)) });
      }
      rows.forEach((x, i) => { x.i = i; });
      rows.sort((a, b) => {
        if (a.key === null && b.key !== null) return 1; if (b.key === null && a.key !== null) return -1;
        const c = compare(a.key, b.key); return (dir === 'desc' ? -c : c) || a.i - b.i;
      });
      rows.forEach((row, i) => row.cells.forEach((cell, j) => {
        const a = addr(t.c1 + j, t.r1 + i); this.set(a, cell.raw); this.fmts[a] = cell.fmt;
      }));
    }
    clone() { const s = new Sheet(); s.raws = Object.assign({}, this.raws); for (const k in this.fmts) s.fmts[k] = Object.assign({}, this.fmts[k]); return s; }
  }

  root.XL = { Sheet, XLError, colNum, colName, addr, parseAddr, parseRange, rangeStr, shiftFormula, display, strip, parseInput, compare };
  if (typeof module !== 'undefined') module.exports = root.XL;
})(typeof window !== 'undefined' ? window : globalThis);
