/* Nível AVANÇADO: desafios feitos no Excel instalado. Nenhuma explicação; as pistas só fazem pensar.
   Os dados são gerados de forma determinística e as respostas são calculadas aqui, para conferir o que a pessoa encontrou. */
(function () {
  'use strict';
  const { TRAILS, LESSONS } = window.COURSE;
  TRAILS.push({ id: 'a1', name: 'Desafios no seu Excel', emoji: '🚀', level: 'Avançado', mode: 'adv' });

  /* gerador pseudoaleatório fixo (mesmos dados para todo mundo) */
  const rng = (seed) => () => { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const pick = (r, a) => a[Math.floor(r() * a.length)];
  const pad = (n) => String(n).padStart(2, '0');
  const tsv = (head, rows) => [head].concat(rows).map((r) => r.join('\t')).join('\n');
  const money = (n) => Math.round(n * 100) / 100;
  const argmax = (o) => Object.keys(o).reduce((a, b) => (o[b] > o[a] ? b : a));

  /* ---------- vendas do ano ---------- */
  let SALES;
  function sales() {
    if (SALES) return SALES;
    const r = rng(20251);
    const vend = ['Ana', 'Bruno', 'Carla', 'Diego', 'Elisa', 'Fábio', 'Gabi', 'Hugo'], regs = ['Norte', 'Sul', 'Leste', 'Oeste'];
    const prods = [['Notebook', 3200], ['Monitor', 900], ['Teclado', 150], ['Mouse', 80], ['Headset', 260]];
    const rows = [];
    for (let i = 0; i < 240; i++) {
      const m = 1 + Math.floor(r() * 12), d = 1 + Math.floor(r() * 28), p = pick(r, prods);
      rows.push({ d: `${pad(d)}/${pad(m)}/2025`, m, v: pick(r, vend), g: pick(r, regs), p: p[0], q: 1 + Math.floor(r() * 9), u: Math.round(p[1] * (0.9 + r() * 0.2)) });
    }
    rows.forEach((x) => { x.f = x.q * x.u; });
    SALES = rows; return rows;
  }
  const salesTsv = () => tsv(['Data', 'Vendedor', 'Região', 'Produto', 'Qtd', 'Preço Unit.'], sales().map((x) => [x.d, x.v, x.g, x.p, x.q, x.u]));
  const sum = (a, f) => a.reduce((s, x) => s + f(x), 0);
  const groupSum = (a, key, f) => { const o = {}; a.forEach((x) => { o[x[key]] = (o[x[key]] || 0) + f(x); }); return o; };

  /* ---------- clientes bagunçados ---------- */
  function clients() {
    const r = rng(777);
    const first = ['Ana', 'Bruno', 'Carla', 'Diego', 'Elisa', 'Fábio', 'Gabriela', 'Hugo', 'Isabela', 'João', 'Karina', 'Lucas'], last = ['Silva', 'Souza', 'Lima', 'Costa', 'Pereira', 'Alves', 'Rocha', 'Dias'];
    const cities = ['São Paulo', 'Rio de Janeiro', 'Belo Horizonte', 'Curitiba', 'Recife'];
    const base = []; const seen = new Set();
    while (base.length < 34) { const n = pick(r, first) + ' ' + pick(r, last); if (!seen.has(n)) { seen.add(n); base.push({ n, c: pick(r, cities) }); } }
    const messy = (s) => { const k = r(); let t = k < 0.25 ? s.toUpperCase() : k < 0.5 ? s.toLowerCase() : s; if (r() < 0.4) t = '  ' + t; if (r() < 0.4) t += ' '; return t; };
    const rows = [];
    for (let i = 0; i < 110; i++) {
      const b = pick(r, base); const k = r();
      if (k < 0.07) { rows.push({ n: '', c: messy(b.c), v: 100 }); continue; }
      if (k < 0.14) { rows.push({ n: messy(b.n), c: messy(b.c), v: pick(r, ['erro', '-', 'n/d']) }); continue; }
      const prev = rows.filter((x) => typeof x.v === 'number' && x.n.trim());
      if (k < 0.34 && prev.length) { const p = pick(r, prev); rows.push({ n: messy(p.n.trim().toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())), c: messy(p.c.trim()), v: p.v }); continue; }
      rows.push({ n: messy(b.n), c: messy(b.c), v: 50 * (1 + Math.floor(r() * 30)) });
    }
    const norm = (s) => String(s).trim().replace(/\s+/g, ' ').toLowerCase();
    const cityOf = {}; base.forEach((b) => { cityOf[norm(b.n)] = b.c; });
    const valid = rows.filter((x) => x.n.trim() && typeof x.v === 'number');
    const uniq = new Map(); valid.forEach((x) => { const k = norm(x.n) + '|' + x.v; if (!uniq.has(k)) uniq.set(k, x); });
    const list = [...uniq.values()];
    const byCity = {}; const names = new Set();
    list.forEach((x) => { const k = norm(x.n); if (!names.has(k)) { names.add(k); const c = cityOf[k]; byCity[c] = (byCity[c] || 0) + 1; } });
    return { rows, count: list.length, total: sum(list, (x) => x.v), city: argmax(byCity), clients: names.size, byCity };
  }

  /* ---------- comissões ---------- */
  function commissions() {
    const r = rng(4242); const rows = [];
    for (let i = 1; i <= 80; i++) rows.push({ id: 'V' + String(i).padStart(3, '0'), v: Math.round(2000 + r() * r() * 88000) });
    const com = (v) => { let c = 0; if (v > 0) c += Math.min(v, 10000) * 0.02; if (v > 10000) c += (Math.min(v, 30000) - 10000) * 0.04; if (v > 30000) c += (v - 30000) * 0.06; if (v >= 50000) c += 500; return c; };
    rows.forEach((x) => { x.c = com(x.v); });
    return { rows, total: sum(rows, (x) => x.c), target: 'V037', targetC: rows[36].c, bonus: rows.filter((x) => x.v >= 50000).length, max: Math.max(...rows.map((x) => x.c)) };
  }

  /* ---------- compras de clientes ---------- */
  function purchases() {
    const r = rng(909); const prods = ['Café', 'Chá', 'Açúcar', 'Leite', 'Pão', 'Queijo'];
    const rows = [];
    for (let i = 0; i < 160; i++) rows.push({ c: 'Cliente ' + pad(1 + Math.floor(r() * r() * 40)), p: pick(r, prods), v: 10 + Math.floor(r() * 90) });
    const cnt = {}, gasto = {}, dist = {};
    rows.forEach((x) => { cnt[x.c] = (cnt[x.c] || 0) + 1; gasto[x.c] = (gasto[x.c] || 0) + x.v; (dist[x.c] = dist[x.c] || new Set()).add(x.p); });
    const ids = Object.keys(cnt);
    return { rows, unique: ids.length, top: argmax(gasto), big: sum(ids.filter((k) => cnt[k] > 4), (k) => gasto[k]), many: ids.filter((k) => dist[k].size >= 3).length, gasto };
  }

  /* ---------- financiamento ---------- */
  function loan() {
    const P = 240000, i = 0.0089, n = 360; const pmt = P * i / (1 - Math.pow(1 + i, -n));
    let s = P, first = 0, saldo60 = 0;
    for (let k = 1; k <= n; k++) { const j = s * i, a = pmt - j; if (!first && a > j) first = k; s -= a; if (k === 60) saldo60 = s; }
    return { P, i, n, pmt: money(pmt), juros: money(pmt * n - P), saldo60: money(saldo60), first };
  }

  const add = (l) => { l.mode = 'adv'; LESSONS.push(l); };
  const S = sales;
  const fmtBR = (n) => n.toLocaleString('pt-BR');

  add({
    id: 'a-desafios', trail: 'a1', title: 'Desafios no Excel', time: '2 a 3 h', intro: '',
    steps: [
      {
        title: 'O relatório do diretor', file: 'vendas-2025',
        brief: '<p>Segunda-feira, 8h. O diretor comercial manda uma mensagem: <em>“Preciso de 5 números do ano de 2025 antes da reunião das 10h. Os dados brutos estão em anexo. Não me mande tabela enorme, só as respostas.”</em></p><p>Cole os dados no seu Excel e descubra.</p>',
        deliver: ['O faturamento é <strong>Quantidade × Preço Unitário</strong>, somado.', 'Responda às 5 perguntas abaixo com os números que você encontrou no Excel.'],
        hints: ['A planilha não tem uma coluna “faturamento”. O que você pode criar (ou calcular) para tê-la?', 'Datas são números disfarçados: o Excel consegue extrair partes delas (mês, ano…).', 'Para comparar categorias (regiões, produtos, vendedores), pense em uma ferramenta que resume dados sem escrever uma fórmula por categoria.'],
        build() {
          const d = S(); const reg = groupSum(d, 'g', (x) => x.f), vend = {}, nv = {}; d.forEach((x) => { vend[x.v] = (vend[x.v] || 0) + x.f; nv[x.v] = (nv[x.v] || 0) + 1; });
          const tick = {}; Object.keys(vend).forEach((k) => { tick[k] = vend[k] / nv[k]; });
          const mes = groupSum(d, 'm', (x) => x.f), prod = groupSum(d, 'p', (x) => x.f); const tot = sum(d, (x) => x.f);
          const mn = Object.keys(mes).reduce((a, b) => (mes[b] < mes[a] ? b : a));
          return { tsv: salesTsv(), rows: d.length, questions: [
            { label: '1. Faturamento total do ano (R$)', answer: tot, tol: 1 },
            { label: '2. Qual <strong>região</strong> teve o maior faturamento?', type: 'text', answer: argmax(reg) },
            { label: '3. Qual <strong>vendedor</strong> tem o maior <strong>ticket médio</strong> (faturamento ÷ nº de vendas)?', type: 'text', answer: argmax(tick) },
            { label: '4. Em qual <strong>mês</strong> (1 a 12) o faturamento foi o menor?', answer: +mn, tol: 0 },
            { label: '5. Que <strong>% do faturamento</strong> vem do produto mais vendido em faturamento? (ex.: 38,5)', answer: Math.round(prod[argmax(prod)] / tot * 1000) / 10, tol: 0.1 }
          ] };
        }
      },
      {
        title: 'Faxina nos dados com Power Query', file: 'clientes-sujos',
        brief: '<p>Chegou do comercial uma lista de clientes digitada por várias pessoas, cheia de sujeira. Seu chefe quer saber quantos clientes e quanto dinheiro existem de verdade ali, e quer poder <strong>repetir a limpeza no mês que vem</strong> com um clique.</p>',
        deliver: ['Descarte linhas sem cliente ou com valor que não é número.', 'Nomes iguais (ignorando maiúsculas/minúsculas e espaços sobrando) são o mesmo cliente. Se o <strong>mesmo cliente</strong> aparece com o <strong>mesmo valor</strong> mais de uma vez, é duplicata: conta uma só.', 'Cada cliente tem uma única cidade (escrita de formas diferentes). A limpeza deve estar feita de forma que possa ser <strong>atualizada</strong> com novos dados.'],
        hints: ['Existe uma ferramenta, na aba Dados, que guarda a “receita” de limpeza para repetir depois.', 'Antes de remover duplicatas, deixe os textos padronizados. Senão “ANA” e “ana” serão diferentes.', 'Duplicata aqui depende de duas colunas juntas, não de uma só.'],
        checklist: ['Os dados foram transformados com o Power Query (e não apagados à mão).', 'Se eu colar mais linhas na origem e clicar em Atualizar, o resultado se refaz sozinho.'],
        build() {
          const c = clients(); return { tsv: tsv(['Cliente', 'Cidade', 'Valor'], c.rows.map((x) => [x.n, x.c, x.v])), rows: c.rows.length, questions: [
            { label: '1. Quantas <strong>linhas válidas e únicas</strong> sobram?', answer: c.count, tol: 0 },
            { label: '2. Qual a <strong>soma dos valores</strong> dessas linhas?', answer: c.total, tol: 0.01 },
            { label: '3. Quantos <strong>clientes distintos</strong> existem?', answer: c.clients, tol: 0 },
            { label: '4. Qual <strong>cidade</strong> tem mais clientes distintos?', type: 'text', answer: c.city }
          ] };
        }
      },
      {
        title: 'Comissão em faixas', file: 'vendedores',
        brief: '<p>O RH precisa fechar a comissão de 80 vendedores e quer um cálculo <strong>auditável</strong>: qualquer pessoa deve conseguir mudar uma regra e ver tudo recalcular.</p><div class="params"><table><tr><td><strong>Até R$ 10.000</strong></td><td>2% sobre esse trecho</td></tr><tr><td><strong>De R$ 10.000 a R$ 30.000</strong></td><td>4% sobre o que passar de 10.000</td></tr><tr><td><strong>Acima de R$ 30.000</strong></td><td>6% sobre o que passar de 30.000</td></tr><tr><td><strong>Bônus</strong></td><td>R$ 500 fixos para quem vender R$ 50.000 ou mais</td></tr></table></div>',
        deliver: ['Cada faixa se aplica <strong>só ao trecho</strong> correspondente (é progressivo, como o imposto de renda).', 'Mantenha as regras (percentuais e limites) em células, nunca escritas dentro das fórmulas.'],
        hints: ['Pense em calcular a comissão de cada trecho separadamente e somar.', 'Se você tem os percentuais e os limites numa tabelinha, a fórmula inteira pode olhar para ela.', 'Para “só o trecho”, pense no menor entre o valor e o teto da faixa, e no maior entre isso e zero.'],
        checklist: ['Os percentuais, os limites das faixas e o bônus estão em células separadas.'],
        build() {
          const c = commissions(); return { tsv: tsv(['Vendedor', 'Vendas (R$)'], c.rows.map((x) => [x.id, x.v])), rows: c.rows.length, questions: [
            { label: '1. <strong>Comissão total</strong> paga pela empresa (com bônus), em R$', answer: c.total, tol: 0.05 },
            { label: `2. Comissão do vendedor <strong>${c.target}</strong>, em R$`, answer: c.targetC, tol: 0.01 },
            { label: '3. Quantos vendedores receberam o <strong>bônus</strong>?', answer: c.bonus, tol: 0 },
            { label: '4. Qual a <strong>maior comissão individual</strong>, em R$?', answer: c.max, tol: 0.01 }
          ] };
        }
      },
      {
        title: 'Painel executivo', file: 'vendas-2025',
        brief: '<p>A diretoria quer um <strong>painel interativo</strong> com os mesmos dados de vendas do primeiro desafio. A pessoa clica e o painel todo responde. Você vai montá-lo e, para provar que funciona, vai usá-lo para responder duas perguntas.</p>',
        deliver: ['Uma tabela de resumo e <strong>pelo menos um gráfico</strong>, ligados aos dados.', 'Filtros clicáveis para <strong>Região</strong> e para <strong>Produto</strong>.', 'Um painel limpo: sem linhas de grade, com títulos claros e formatação de moeda.'],
        hints: ['Resumo + gráfico + filtros clicáveis: três recursos que se conectam entre si.', 'Você vai precisar do faturamento como um campo. Onde ele pode ser criado?', 'Uma única fonte de dados deve alimentar todos os elementos do painel.'],
        checklist: ['Existe uma tabela dinâmica e um gráfico ligado a ela.', 'Existem segmentações de dados (botões de filtro) para Região e para Produto.', 'As linhas de grade estão ocultas e os valores estão em formato de moeda.'],
        build() {
          const d = S(); const prodT = groupSum(d, 'p', (x) => x.f); const lider = argmax(prodT);
          const sel = d.filter((x) => x.g === 'Sul' && x.p === 'Monitor'); const sul = d.filter((x) => x.g === 'Sul'); const byV = groupSum(sul, 'v', (x) => x.f);
          return { tsv: salesTsv(), rows: d.length, questions: [
            { label: '1. Com os filtros <strong>Região = Sul</strong> e <strong>Produto = Monitor</strong>, qual o faturamento (R$)?', answer: sum(sel, (x) => x.f), tol: 1 },
            { label: '2. Só com <strong>Região = Sul</strong>, qual <strong>vendedor</strong> lidera em faturamento?', type: 'text', answer: argmax(byV) },
            { label: '3. Qual é o produto de maior faturamento no ano todo (sem filtros)?', type: 'text', answer: lider }
          ] };
        }
      },
      {
        title: 'Sem tabela dinâmica: fórmulas dinâmicas', file: 'compras-clientes',
        brief: '<p>Um analista pediu uma análise de recorrência de clientes, mas com uma exigência: <strong>nada de tabela dinâmica</strong>. Tudo deve ser feito com fórmulas que se atualizam sozinhas, porque a planilha será usada por pessoas que nunca vão clicar em “Atualizar”.</p><p>Cada linha é uma compra.</p>',
        deliver: ['Use as funções novas do Microsoft 365 que devolvem listas (<em>matrizes dinâmicas</em>).', 'Nenhuma tabela dinâmica nem filtro manual.'],
        hints: ['Algumas fórmulas do Microsoft 365 devolvem várias células de uma vez. Procure as que eliminam repetidos e as que filtram por condição.', 'Primeiro tenha a lista de clientes sem repetição; só depois calcule o que cada um fez.', 'Uma fórmula pode receber o resultado de outra como “lista” de entrada.'],
        checklist: ['Usei fórmulas que derramam resultados (matrizes dinâmicas) em vez de tabela dinâmica.'],
        build() {
          const p = purchases(); return { tsv: tsv(['Cliente', 'Produto', 'Valor'], p.rows.map((x) => [x.c, x.p, x.v])), rows: p.rows.length, questions: [
            { label: '1. Quantos <strong>clientes distintos</strong> compraram?', answer: p.unique, tol: 0 },
            { label: '2. Qual cliente <strong>mais gastou</strong> no total? (ex.: Cliente 07)', type: 'text', answer: p.top },
            { label: '3. Quanto gastaram, <strong>somados</strong>, os clientes com <strong>mais de 4 compras</strong>? (R$)', answer: p.big, tol: 0.01 },
            { label: '4. Quantos clientes compraram <strong>3 ou mais produtos diferentes</strong>?', answer: p.many, tol: 0 }
          ] };
        }
      },
      {
        title: 'Simulador de financiamento',
        brief: '<p>Um cliente vai financiar um imóvel e quer entender <strong>onde está o dinheiro</strong> antes de assinar. Construa uma <strong>tabela de amortização</strong> completa no sistema <strong>Price</strong> (parcelas fixas) para os dados abaixo.</p>',
        deliver: ['Uma linha por mês, com: parcela, juros, amortização do principal e saldo devedor.', 'Os dados do contrato (valor, taxa, prazo) devem ficar em <strong>células de entrada</strong>: se mudarem, a tabela refaz.'],
        hints: ['Existe uma função financeira que calcula o valor de uma parcela fixa. Procure na categoria Financeira.', 'Juros do mês = saldo anterior × taxa. O que sobra da parcela abate a dívida.', 'Para achar “a primeira parcela em que…”, pense em comparar duas colunas e procurar a primeira vez que a condição vira verdadeira.'],
        checklist: ['Os dados do contrato estão em células de entrada (e a tabela os usa).', 'O saldo devedor da última parcela termina em zero (ou quase).'],
        build() {
          const L = loan(); return { params: `<table><tr><td>Valor financiado</td><td><strong>R$ 240.000,00</strong></td></tr><tr><td>Taxa de juros</td><td><strong>0,89% ao mês</strong></td></tr><tr><td>Prazo</td><td><strong>360 meses</strong></td></tr><tr><td>Sistema</td><td><strong>Price (parcela fixa)</strong></td></tr></table>`, questions: [
            { label: '1. <strong>Valor da parcela</strong> mensal (R$)', answer: L.pmt, tol: 0.02 },
            { label: '2. <strong>Total de juros</strong> pagos no contrato inteiro (R$)', answer: L.juros, tol: 1 },
            { label: '3. <strong>Saldo devedor</strong> logo após pagar a parcela nº 60 (R$)', answer: L.saldo60, tol: 1 },
            { label: '4. Em qual <strong>nº de parcela</strong> a amortização do principal passa a ser maior que os juros da própria parcela?', answer: L.first, tol: 0 }
          ] };
        }
      }
    ]
  });
})();
