/* Conteúdo: trilhas, aulas e passos. Cada passo = explicação + desenho + missão prática. */
(function () {
  'use strict';
  const { strip } = XL;

  /* ----- atalhos para montar dados e conferir respostas ----- */
  const T = (rows, col0 = 1, row0 = 1) => {
    const o = {};
    rows.forEach((row, i) => row.forEach((v, j) => { if (v !== null && v !== '') o[XL.addr(col0 + j, row0 + i)] = v; }));
    return o;
  };
  const norm = (raw) => strip(raw).replace(/\s/g, '');          // "=média( B2 )" -> "=MEDIA(B2)"
  const isF = (raw) => raw[0] === '=';
  const uses = (raw, ...parts) => isF(raw) && parts.every((p) => norm(raw).includes(p.toUpperCase()));
  const sameText = (a, b) => typeof a === 'string' && strip(a.trim()) === strip(b);
  const tsv = (rows) => rows.map((r) => r.join('\t')).join('\n');
  // confere se a fórmula continua certa quando mudamos uma entrada (prova que não digitou o resultado "no braço")
  const works = (ctx, changes, cell, expected) => {
    const s = ctx.sheet.clone(); for (const k in changes) s.set(k, changes[k]);
    const v = s.value(cell); return v === expected || (typeof v === 'number' && typeof expected === 'number' && Math.abs(v - expected) < 1e-9);
  };

  const TRAILS = [
    { id: 't1', name: 'Primeiros passos', emoji: '🌱', level: 'Iniciante' },
    { id: 't2', name: 'Fórmulas essenciais', emoji: '🧮', level: 'Iniciante' },
    { id: 't3', name: 'Decisões e critérios', emoji: '🔀', level: 'Intermediário' },
    { id: 't4', name: 'Procurar informação', emoji: '🔎', level: 'Intermediário' },
    { id: 't5', name: 'Análise de dados', emoji: '📊', level: 'Intermediário' },
    { id: 't6', name: 'Avançado e projeto', emoji: '🚀', level: 'Avançado' }
  ];

  const LESSONS = [];

  /* ========================================================= T1 */
  LESSONS.push({
    id: 'planilha', trail: 't1', title: 'Conhecendo a planilha', time: '8 min',
    intro: 'Vamos abrir o Excel pela primeira vez. Sem pressa: um passo por vez, e você sempre pratica na hora.',
    steps: [
      {
        title: 'A planilha é uma grade gigante',
        say: '<p>Quando você abre o Excel, vê uma grade cheia de quadradinhos. Cada quadradinho é uma <strong>célula</strong>. É nela que você escreve.</p><p>As <strong>colunas</strong> (de cima para baixo) têm letras: A, B, C… As <strong>linhas</strong> (da esquerda para a direita) têm números: 1, 2, 3…</p>',
        draw: D.window(),
        sheet: { cols: 6, rows: 8 }, hl: ['B3'],
        task: 'Clique na célula <strong>B3</strong> (a que está piscando em verde).',
        hint: 'B3 está na coluna B (a segunda) e na linha 3 (a terceira).',
        check: (c) => c.sel.is('B3'),
        solve: (v) => v.selectRange('B3'),
        win: 'Isso! Você achou a célula B3. Repare: a coluna B e a linha 3 ficaram marcadas no cabeçalho.'
      },
      {
        title: 'Todo quadradinho tem um endereço',
        say: '<p>O <strong>endereço</strong> de uma célula é a <em>letra da coluna + número da linha</em>. Como no jogo batalha naval!</p><p>O endereço da célula selecionada aparece sempre na <strong>Caixa de Nome</strong>, no canto de cima à esquerda.</p>',
        draw: D.grid({ cols: 4, rows: 4, hl: ['C2'], cells: { C2: 'C2' }, notes: [{ at: 'C2', text: 'Coluna C +\nlinha 2 = C2', side: 'right' }, { at: 'C1', text: 'coluna', side: 'top', cls: 'b' }, { at: 'A2', text: 'linha', side: 'left', cls: 'b' }] }),
        sheet: { cols: 6, rows: 8 },
        task: 'Clique na célula <strong>D5</strong> e confira na Caixa de Nome se está escrito D5.',
        hint: 'Ache a coluna D e desça até a linha 5.',
        check: (c) => c.sel.is('D5'),
        solve: (v) => v.selectRange('D5'),
        win: 'Perfeito! Endereços serão o idioma das suas fórmulas: B2, D5, A10…'
      },
      {
        title: 'Escrevendo texto',
        say: '<p>Para escrever, é só clicar na célula, digitar e apertar <kbd>Enter</kbd>. O Enter confirma e desce para a célula de baixo.</p><p>Textos ficam alinhados à <strong>esquerda</strong> da célula.</p>',
        draw: D.pair({ cols: 2, rows: 2, hl: ['A1'], cells: { A1: 'Luis▏' }, notes: [{ at: 'A1', text: 'você digita…', side: 'bottom' }] }, { cols: 2, rows: 2, hl2: ['A2'], cells: { A1: 'Luis' }, notes: [{ at: 'A2', text: 'Enter desce\npara cá', side: 'bottom' }] }, 'Enter'),
        sheet: { cols: 5, rows: 6, data: { A2: 'Meu nome:' }, sel: 'B2' },
        hl: ['B2'],
        task: 'Clique em <strong>B2</strong>, digite o seu nome e aperte <kbd>Enter</kbd>.',
        hint: 'É só clicar na célula e começar a digitar — não precisa de nada antes.',
        check: (c) => { const v = c.v('B2'); return typeof v === 'string' && v.trim().length > 0 ? true : false; },
        solve: (v) => v.setCell('B2', 'Luis'),
        win: 'Seu nome está na planilha. Note que ele ficou alinhado à esquerda: o Excel sabe que é texto.'
      },
      {
        title: 'Escrevendo números',
        say: '<p>Números ficam alinhados à <strong>direita</strong>. Essa é a pista de que o Excel entendeu que dá para fazer conta com eles.</p><p>Se ficar à esquerda, ele está tratando como texto!</p>',
        draw: D.grid({ cols: 3, rows: 3, cells: { A1: 'Arroz', B1: '12', A2: 'Feijão', B2: '8' }, notes: [{ at: 'B1:B2', text: 'números:\nencostam\nà direita', side: 'right' }, { at: 'A1:A2', text: 'texto: encosta\nà esquerda', side: 'left', cls: 'b' }] }),
        sheet: { cols: 4, rows: 6, data: { A1: 'Arroz', A2: 'Feijão', B1: '' }, sel: 'B1', colW: [110, 90, 90, 90] },
        hl: ['B1:B2'],
        task: 'Digite o preço do Arroz em <strong>B1</strong>: <code>12</code>, aperte <kbd>Enter</kbd> e depois o do Feijão em <strong>B2</strong>: <code>8</code>.',
        hint: 'Depois do Enter você já cai na B2. Digite 8 e Enter de novo.',
        check: (c) => c.v('B1') === 12 && c.v('B2') === 8,
        solve: (v) => { v.setCell('B1', '12'); v.setCell('B2', '8'); },
        win: 'Dois números na planilha, alinhados à direita. Já dá para fazer contas com eles!'
      },
      {
        title: 'Corrigindo um erro',
        say: '<p>Errou uma letra? Não precisa apagar tudo. Dê <strong>dois cliques</strong> na célula (ou clique nela e aperte <kbd>F2</kbd>) para editar o que já está lá.</p><p>Se você só clicar e digitar, o texto novo <em>substitui</em> o antigo.</p>',
        draw: D.grid({ cols: 3, rows: 3, cells: { A1: 'Arroz', A2: 'Fejão', A3: 'Café' }, hl2: ['A2'], notes: [{ at: 'A2', text: 'faltou o “i”!\nDuplo clique ou F2', side: 'right' }] }),
        sheet: { cols: 4, rows: 5, data: { A1: 'Arroz', A2: 'Fejão', A3: 'Café' }, sel: 'A1' },
        hl: ['A2'],
        task: 'O nome em <strong>A2</strong> está errado. Corrija para <strong>Feijão</strong>.',
        hint: 'Clique na A2, aperte F2, arrume a letra e aperte Enter. Ou digite Feijão por cima.',
        check: (c) => c.raw('A2') === 'Feijão',
        solve: (v) => v.setCell('A2', 'Feijão'),
        win: 'Corrigido. Duplo clique / F2 vai ser seu melhor amigo.'
      },
      {
        title: 'Selecionando e apagando',
        say: '<p>Para pegar várias células de uma vez, <strong>arraste</strong> o mouse sobre elas (ou segure <kbd>Shift</kbd> e use as setas). O grupo se chama <strong>intervalo</strong> e se escreve assim: <code>B1:B3</code> (de B1 até B3).</p><p>Com o intervalo selecionado, <kbd>Delete</kbd> apaga tudo.</p>',
        draw: D.grid({ cols: 3, rows: 4, cells: { B1: 'teste', B2: 'teste', B3: 'teste' }, hl: ['B1:B3'], notes: [{ at: 'B1:B3', text: 'intervalo B1:B3\n(arraste de B1\naté B3)', side: 'right' }] }),
        sheet: { cols: 4, rows: 6, data: { A1: 'Lixo', A2: 'Lixo', A3: 'Lixo', A4: 'Fica!' } },
        hl: ['A1:A3'],
        task: 'Selecione <strong>A1:A3</strong> arrastando o mouse e aperte <kbd>Delete</kbd>. Cuidado para <em>não</em> apagar o “Fica!”.',
        hint: 'Clique na A1, segure o botão e arraste até A3. Solte e aperte Delete.',
        check: (c) => c.raw('A1') === '' && c.raw('A2') === '' && c.raw('A3') === '' && c.raw('A4') === 'Fica!',
        solve: (v) => { v.selectRange('A1:A3'); v.clearSel(); },
        win: 'Limpo! Você já sabe: selecionar, digitar, corrigir e apagar. Isso é 80% do uso básico.'
      }
    ]
  });

  LESSONS.push({
    id: 'contas', trail: 't1', title: 'Primeiras contas', time: '12 min',
    intro: 'O Excel brilha quando faz as contas por você. A regra de ouro: tudo começa com o sinal de igual.',
    steps: [
      {
        title: 'Toda conta começa com “=”',
        say: '<p>Para o Excel entender que você quer uma <strong>conta</strong>, comece com <code>=</code>. Sem ele, o Excel pensa que é só texto.</p><p>Os sinais são: <code>+</code> somar, <code>-</code> subtrair, <code>*</code> multiplicar, <code>/</code> dividir.</p>',
        draw: D.pair({ cols: 2, rows: 2, hl: ['A1'], cells: { A1: '=2+3' }, notes: [{ at: 'A1', text: 'você digita', side: 'bottom' }] }, { cols: 2, rows: 2, hl: ['A1'], cells: { A1: '5' }, notes: [{ at: 'A1', text: 'o Excel mostra', side: 'bottom' }] }, 'Enter'),
        sheet: { cols: 4, rows: 5, sel: 'B2' }, hl: ['B2'],
        task: 'Em <strong>B2</strong>, digite <code>=2+3</code> e aperte Enter.',
        hint: 'Não esqueça o = no começo, sem espaços: =2+3',
        check: (c) => { const r = c.raw('B2'); if (r.replace(/\s/g, '') === '2+3') return 'Faltou o <strong>=</strong> no começo! Sem ele o Excel acha que é texto.'; return isF(r) && c.v('B2') === 5; },
        solve: (v) => v.setCell('B2', '=2+3'),
        win: 'Resultado 5! Clique na B2 e olhe a barra de fórmulas: lá aparece o que você digitou (=2+3), na célula aparece o resultado.'
      },
      {
        title: 'Faça contas com células, não com números',
        say: '<p>Aqui está o segredo do Excel: em vez de digitar os números na conta, <strong>aponte para as células</strong> onde eles estão. Assim, se um número mudar, a conta se atualiza sozinha.</p><p>Dica: ao digitar <code>=</code>, você pode <strong>clicar</strong> na célula em vez de digitar o endereço.</p>',
        draw: D.grid({ cols: 3, rows: 3, cells: { A1: 'Salário', B1: '3000', A2: 'Aluguel', B2: '1200', A3: 'Sobra', B3: '=B1-B2' }, hl: ['B3'], hl2: ['B1', 'B2'], notes: [{ at: 'B3', text: 'a conta usa os\nendereços B1 e B2', side: 'right' }] }),
        sheet: { cols: 4, rows: 5, data: T([['Salário', 3000], ['Aluguel', 1200], ['Sobra', '']]), sel: 'B3', colW: [100, 90, 90, 90] }, hl: ['B3'],
        task: 'Em <strong>B3</strong>, calcule a sobra: salário menos aluguel. Use os endereços: <code>=B1-B2</code>.',
        hint: 'Digite =, clique na B1, digite -, clique na B2 e aperte Enter.',
        check: (c) => { const r = c.raw('B3'); if (c.v('B3') === 1800 && !uses(r, 'B1', 'B2')) return 'O resultado está certo, mas você digitou números. Use <strong>B1</strong> e <strong>B2</strong> na conta, assim ela acompanha as mudanças.'; return uses(r, 'B1', 'B2') && c.v('B3') === 1800; },
        solve: (v) => v.setCell('B3', '=B1-B2'),
        win: 'R$ 1.800 de sobra. Agora vem a mágica…'
      },
      {
        title: 'A mágica: tudo se atualiza',
        say: '<p>Mude o salário e veja a sobra <strong>mudar sozinha</strong>. Em vez de refazer conta por conta, você troca um número e o Excel recalcula tudo. É por isso que se chama <em>planilha de cálculo</em>.</p>',
        draw: D.pair({ cols: 3, rows: 3, cells: { A1: 'Salário', B1: '3000', A2: 'Aluguel', B2: '1200', A3: 'Sobra', B3: '1800' }, hl: ['B1'] }, { cols: 3, rows: 3, cells: { A1: 'Salário', B1: '3500', A2: 'Aluguel', B2: '1200', A3: 'Sobra', B3: '2300' }, hl: ['B3'] }, 'muda B1'),
        sheet: { cols: 4, rows: 5, data: T([['Salário', 3000], ['Aluguel', 1200], ['Sobra', '=B1-B2']]), sel: 'A5', colW: [100, 90, 90, 90] }, hl: ['B1'],
        task: 'Troque o salário em <strong>B1</strong> para <code>3500</code> e veja a Sobra virar 2300.',
        hint: 'Clique na B1, digite 3500 e aperte Enter.',
        check: (c) => c.v('B1') === 3500 && c.v('B3') === 2300,
        solve: (v) => v.setCell('B1', '3500'),
        win: 'Viu? Você mexeu em 1 número e o resultado mudou sozinho. Essa é a base de tudo.'
      },
      {
        title: 'Multiplicando: total da compra',
        say: '<p>Vamos a um caso do dia a dia: <strong>preço × quantidade = total</strong>.</p>',
        draw: D.grid({ cols: 4, rows: 4, cells: { A1: 'Produto', B1: 'Preço', C1: 'Qtd', D1: 'Total', A2: 'Caneta', B2: '3', C2: '10', D2: '=B2*C2' }, hl: ['D2'], hl2: ['B2', 'C2'], bold: ['A1', 'B1', 'C1', 'D1'], notes: [{ at: 'D2', text: 'preço × quantidade\n= B2 * C2', side: 'right' }] }),
        sheet: { cols: 5, rows: 6, data: T([['Produto', 'Preço', 'Qtd', 'Total'], ['Caneta', 3, 10], ['Caderno', 20, 4], ['Mochila', 80, 2]]), sel: 'D2' }, hl: ['D2'],
        task: 'Em <strong>D2</strong>, calcule o total das canetas: <code>=B2*C2</code>.',
        hint: 'O sinal de multiplicar é o asterisco (*), geralmente em cima do 8 ou no teclado numérico.',
        check: (c) => uses(c.raw('D2'), 'B2', 'C2') && c.v('D2') === 30,
        solve: (v) => v.setCell('D2', '=B2*C2'),
        win: '3 × 10 = 30. Mas ainda faltam o caderno e a mochila…'
      },
      {
        title: 'Copiando a fórmula para as outras linhas',
        say: '<p>Não precisa digitar a fórmula de novo em cada linha! Selecione a célula pronta <em>e as de baixo</em> e use <strong>Preencher para baixo</strong> (<kbd>Ctrl</kbd>+<kbd>D</kbd>).</p><p>O Excel é esperto: na linha de baixo ele troca <code>B2*C2</code> por <code>B3*C3</code>, e assim por diante.</p>',
        draw: D.grid({ cols: 4, rows: 4, cells: { A1: 'Produto', B1: 'Preço', C1: 'Qtd', D1: 'Total', D2: '=B2*C2', D3: '=B3*C3', D4: '=B4*C4' }, hl: ['D2:D4'], notes: [{ at: 'D2:D4', text: 'a fórmula “anda”\njunto com a linha', side: 'right' }] }),
        sheet: { cols: 5, rows: 6, data: Object.assign(T([['Produto', 'Preço', 'Qtd', 'Total'], ['Caneta', 3, 10], ['Caderno', 20, 4], ['Mochila', 80, 2]]), { D2: '=B2*C2' }), tools: ['fill'], sel: 'D2' }, hl: ['D2:D4'],
        task: 'Selecione <strong>D2:D4</strong> (arraste de D2 até D4) e clique em <strong>⬇ Preencher</strong> (ou aperte Ctrl+D).',
        hint: 'Clique na D2, arraste até a D4, solte e clique no botão ⬇ Preencher.',
        check: (c) => c.v('D3') === 80 && c.v('D4') === 160 && uses(c.raw('D3'), 'B3', 'C3'),
        solve: (v) => { v.selectRange('D2:D4'); v.fillDown('D2:D4'); },
        win: 'Os três totais calculados com uma ação só. No Excel de verdade você também pode arrastar o quadradinho no canto da célula (alça de preenchimento) ou dar duplo clique nele.'
      },
      {
        title: 'Somando tudo com SOMA',
        say: '<p>Para somar várias células, use a função <code>SOMA</code>. Uma <strong>função</strong> é uma ferramenta pronta do Excel: nome + parênteses + o que ela vai usar.</p><p><code>=SOMA(D2:D4)</code> significa “some de D2 até D4”. Os <code>:</code> querem dizer “até”.</p>',
        draw: D.grid({ cols: 4, rows: 5, cells: { D1: 'Total', D2: '30', D3: '80', D4: '160', C5: 'Soma:', D5: '=SOMA(D2:D4)' }, hl2: ['D2:D4'], hl: ['D5'], notes: [{ at: 'D5', text: '“some de D2\naté D4”', side: 'right' }] }),
        sheet: { cols: 5, rows: 7, data: Object.assign(T([['Produto', 'Preço', 'Qtd', 'Total'], ['Caneta', 3, 10], ['Caderno', 20, 4], ['Mochila', 80, 2]]), { D2: '=B2*C2', D3: '=B3*C3', D4: '=B4*C4', C5: 'Geral' }), sel: 'D5' }, hl: ['D5'],
        task: 'Em <strong>D5</strong>, some os totais: <code>=SOMA(D2:D4)</code>.',
        hint: 'Digite =SOMA( depois arraste da D2 até a D4, feche o parêntese e Enter. No Excel real, o atalho Alt+= faz a soma automática.',
        check: (c) => uses(c.raw('D5'), 'SOMA', 'D2', 'D4') && c.v('D5') === 270,
        solve: (v) => v.setCell('D5', '=SOMA(D2:D4)'),
        win: 'R$ 270 no total. Você acaba de usar sua primeira função!'
      }
    ]
  });

  LESSONS.push({
    id: 'bonito', trail: 't1', title: 'Deixando bonito', time: '5 min',
    intro: 'Uma planilha legível vale mais. Três formatações que você vai usar o tempo todo.',
    steps: [
      {
        title: 'Negrito no cabeçalho',
        say: '<p>Para destacar títulos, selecione as células e clique em <strong>N</strong> (negrito) — ou <kbd>Ctrl</kbd>+<kbd>B</kbd>.</p>',
        draw: D.pair({ cols: 3, rows: 2, cells: { A1: 'Item', B1: 'Preço', C1: 'Qtd', A2: 'Pão', B2: '5', C2: '2' }, hl: ['A1:C1'] }, { cols: 3, rows: 2, cells: { A1: 'Item', B1: 'Preço', C1: 'Qtd', A2: 'Pão', B2: '5', C2: '2' }, bold: ['A1', 'B1', 'C1'] }, 'N'),
        sheet: { cols: 4, rows: 4, data: T([['Item', 'Preço', 'Qtd'], ['Pão', 5, 2], ['Leite', 6, 1]]), tools: ['bold'] }, hl: ['A1:C1'],
        task: 'Selecione <strong>A1:C1</strong> e clique no botão <strong>N</strong>.',
        hint: 'Arraste de A1 até C1 e clique em N na barra de cima.',
        check: (c) => ['A1', 'B1', 'C1'].every((a) => c.fmt(a).bold),
        solve: (v) => { v.selectRange('A1:C1'); v.format('A1:C1', 'bold'); },
        win: 'Cabeçalho em destaque.'
      },
      {
        title: 'Formato de moeda',
        say: '<p>Quando um número é dinheiro, mostre como dinheiro. Selecione e clique em <strong>R$</strong>. Importante: o valor continua sendo o mesmo número, só muda a aparência.</p>',
        draw: D.pair({ cols: 2, rows: 3, cells: { A1: 'Preço', A2: '5', A3: '6,5' }, hl: ['A2:A3'] }, { cols: 2, rows: 3, w: 90, cells: { A1: 'Preço', A2: 'R$ 5,00', A3: 'R$ 6,50' }, hl: ['A2:A3'] }, 'R$'),
        sheet: { cols: 4, rows: 4, data: T([['Item', 'Preço'], ['Pão', 5], ['Leite', '6,5']]), tools: ['bold', 'money', 'percent'], sel: 'B2' }, hl: ['B2:B3'],
        task: 'Selecione <strong>B2:B3</strong> e clique em <strong>R$</strong>.',
        hint: 'Arraste de B2 até B3 e clique no botão R$.',
        check: (c) => c.fmt('B2').num === 'money' && c.fmt('B3').num === 'money',
        solve: (v) => { v.selectRange('B2:B3'); v.format('B2:B3', 'money'); },
        win: 'Agora os preços mostram R$ e duas casas decimais.'
      },
      {
        title: 'Formato de porcentagem',
        say: '<p>No Excel, 100% é o número <code>1</code>, e 25% é <code>0,25</code>. O botão <strong>%</strong> transforma 0,25 em <strong>25%</strong>. Se preferir, digite já com o sinal: <code>25%</code>.</p>',
        draw: D.pair({ cols: 2, rows: 3, cells: { A1: 'Taxa', A2: '0,25', A3: '0,5' }, hl: ['A2:A3'] }, { cols: 2, rows: 3, cells: { A1: 'Taxa', A2: '25%', A3: '50%' }, hl: ['A2:A3'] }, '%'),
        sheet: { cols: 4, rows: 4, data: T([['Item', 'Desconto'], ['Pão', '0,25'], ['Leite', '0,5']]), tools: ['bold', 'money', 'percent'], sel: 'B2' }, hl: ['B2:B3'],
        task: 'Selecione <strong>B2:B3</strong> e clique em <strong>%</strong>.',
        hint: 'Arraste de B2 até B3 e clique no botão %.',
        check: (c) => c.fmt('B2').num === 'percent' && c.fmt('B3').num === 'percent',
        solve: (v) => { v.selectRange('B2:B3'); v.format('B2:B3', 'percent'); },
        win: 'Fechou a trilha 1! Você já mexe na planilha, faz contas e formata.'
      }
    ]
  });

  /* ========================================================= T2 */
  const NOTAS = T([['Aluno', 'Nota'], ['Ana', 7], ['Bruno', 5], ['Carla', 9], ['Diego', 6], ['Elisa', 8]]);
  LESSONS.push({
    id: 'estatistica', trail: 't2', title: 'Média, maior e menor', time: '8 min',
    intro: 'Funções que resumem uma lista inteira de números em uma resposta. São as mais pedidas no trabalho.',
    steps: [
      {
        title: 'MÉDIA',
        say: '<p>A função <code>MÉDIA</code> soma tudo e divide pela quantidade. Escreva: <code>=MÉDIA(B2:B6)</code>.</p><p>No Excel de verdade, ao digitar <code>=MÉD</code> aparece uma lista: aperte <kbd>Tab</kbd> para completar.</p>',
        draw: D.grid({ cols: 3, rows: 7, cells: { A1: 'Aluno', B1: 'Nota', A2: 'Ana', B2: '7', A3: 'Bruno', B3: '5', A4: 'Carla', B4: '9', A5: 'Diego', B5: '6', A6: 'Elisa', B6: '8', A7: 'Média', B7: '=MÉDIA(B2:B6)' }, hl2: ['B2:B6'], hl: ['B7'], notes: [{ at: 'B7', text: 'média das notas\nde B2 até B6', side: 'right' }] }),
        sheet: { cols: 4, rows: 9, data: Object.assign({ A8: 'Média' }, NOTAS), sel: 'B8' }, hl: ['B8'],
        task: 'Em <strong>B8</strong>, calcule a média das notas com <code>=MÉDIA(B2:B6)</code>.',
        hint: 'Digite =MÉDIA( e arraste de B2 até B6, feche o parêntese e Enter.',
        check: (c) => uses(c.raw('B8'), 'MEDIA', 'B2', 'B6') && c.v('B8') === 7,
        solve: (v) => v.setCell('B8', '=MÉDIA(B2:B6)'),
        win: 'Média 7. E se uma nota mudar, a média muda junto.'
      },
      {
        title: 'MÁXIMO e MÍNIMO',
        say: '<p>Quer saber a <strong>maior</strong> e a <strong>menor</strong> nota? Use <code>MÁXIMO</code> e <code>MÍNIMO</code>. Funcionam igual à MÉDIA: você diz qual intervalo olhar.</p>',
        draw: D.grid({ cols: 3, rows: 4, cells: { A1: 'Maior', B1: '=MÁXIMO(B2:B6)', A2: 'Menor', B2: '=MÍNIMO(B2:B6)' }, w: 120, hl: ['B1:B2'], notes: [{ at: 'B1:B2', text: 'mesmo intervalo,\nresposta diferente', side: 'right' }] }),
        sheet: { cols: 4, rows: 11, data: Object.assign({ A8: 'Média', B8: '=MÉDIA(B2:B6)', A9: 'Maior', A10: 'Menor' }, NOTAS), sel: 'B9' }, hl: ['B9:B10'],
        task: 'Em <strong>B9</strong> calcule a maior nota e em <strong>B10</strong> a menor nota (intervalo B2:B6).',
        hint: 'B9: =MÁXIMO(B2:B6)   —   B10: =MÍNIMO(B2:B6)',
        check: (c) => uses(c.raw('B9'), 'MAXIMO', 'B2', 'B6') && c.v('B9') === 9 && uses(c.raw('B10'), 'MINIMO', 'B2', 'B6') && c.v('B10') === 5,
        solve: (v) => { v.setCell('B9', '=MÁXIMO(B2:B6)'); v.setCell('B10', '=MÍNIMO(B2:B6)'); },
        win: 'Maior 9, menor 5. Em segundos, qualquer lista fica resumida.'
      },
      {
        title: 'Contando com CONT.NÚM',
        say: '<p><code>CONT.NÚM</code> conta quantas células têm <strong>número</strong>. Ótimo para saber “quantos fizeram a prova?”. Células vazias e textos não entram na conta.</p>',
        draw: D.grid({ cols: 3, rows: 6, cells: { A1: 'Aluno', B1: 'Nota', A2: 'Ana', B2: '7', A3: 'Bruno', B3: '5', A4: 'Carla', A5: 'Diego', B5: '6', A6: 'Total', B6: '=CONT.NÚM(B2:B5)' }, hl: ['B6'], hl2: ['B4'], notes: [{ at: 'B4', text: 'faltou: vazia,\nnão conta', side: 'right', cls: 'b' }] }),
        sheet: { cols: 4, rows: 9, data: Object.assign(T([['Aluno', 'Nota'], ['Ana', 7], ['Bruno', 5], ['Carla'], ['Diego', 6], ['Elisa', 8]]), { A8: 'Fizeram' }), sel: 'B8' }, hl: ['B8'],
        task: 'Em <strong>B8</strong>, conte quantos alunos têm nota: <code>=CONT.NÚM(B2:B6)</code>.',
        hint: 'Parece MÉDIA, só muda o nome: =CONT.NÚM(B2:B6)',
        check: (c) => uses(c.raw('B8'), 'CONT.NUM', 'B2', 'B6') && c.v('B8') === 4,
        solve: (v) => v.setCell('B8', '=CONT.NÚM(B2:B6)'),
        win: '4 alunos fizeram a prova (a Carla está vazia, então ficou de fora).'
      }
    ]
  });

  LESSONS.push({
    id: 'dolar', trail: 't2', title: 'Travando células com $', time: '8 min',
    intro: 'O erro nº 1 de quem está começando: copiar uma fórmula e ela “sair do lugar”. O cifrão resolve.',
    steps: [
      {
        title: 'Um desconto para todos os produtos',
        say: '<p>O desconto de <strong>10%</strong> está em B1. Queremos o preço com desconto de cada produto: <code>preço × (1 − desconto)</code>.</p>',
        draw: D.grid({ cols: 3, rows: 5, cells: { A1: 'Desconto', B1: '10%', A3: 'Produto', B3: 'Preço', C3: 'Com desc.', A4: 'Camiseta', B4: '80', C4: '=B4*(1-B1)' }, hl: ['C4'], hl2: ['B1'], notes: [{ at: 'B1', text: 'desconto fica\nsó aqui', side: 'right' }] }),
        sheet: { cols: 4, rows: 7, data: Object.assign(T([['Desconto', '10%'], [], ['Produto', 'Preço', 'Com desc.'], ['Camiseta', 80], ['Calça', 150], ['Tênis', 200]])), tools: ['fill'], sel: 'C4' }, hl: ['C4'],
        task: 'Em <strong>C4</strong>, calcule o preço da camiseta com desconto: <code>=B4*(1-B1)</code>.',
        hint: 'Preço (B4) vezes um menos o desconto (B1).',
        check: (c) => uses(c.raw('C4'), 'B4', 'B1') && c.v('C4') === 72,
        solve: (v) => v.setCell('C4', '=B4*(1-B1)'),
        win: '80 com 10% de desconto = R$ 72. Agora o teste de fogo: copiar para baixo.'
      },
      {
        title: 'Ops! A fórmula saiu do lugar',
        say: '<p>Vamos ver o problema de perto. Ao preencher para baixo, o Excel <strong>desloca todos os endereços</strong> — inclusive o <code>B1</code> do desconto, que virou <code>B2</code>, <code>B3</code>… e aí a conta quebra.</p>',
        draw: D.grid({ cols: 3, rows: 6, cells: { B1: '10%', C4: '=B4*(1-B1)', C5: '=B5*(1-B2)', C6: '=B6*(1-B3)' }, hl2: ['B1'], hl: ['C5:C6'], notes: [{ at: 'C5:C6', text: 'B1 virou B2, B3…\nmas o desconto\nficou em B1!', side: 'right', cls: 'b' }] }),
        sheet: { cols: 4, rows: 7, data: Object.assign(T([['Desconto', '10%'], [], ['Produto', 'Preço', 'Com desc.'], ['Camiseta', 80, '=B4*(1-B1)'], ['Calça', 150], ['Tênis', 200]])), tools: ['fill'], sel: 'C4' }, hl: ['C4:C6'],
        task: 'Selecione <strong>C4:C6</strong> e clique em <strong>⬇ Preencher</strong>. Depois clique na <strong>C5</strong> e veja a fórmula com problema.',
        hint: 'Arraste de C4 até C6 e clique em ⬇ Preencher. Em C5 você verá =B5*(1-B2): o B2 está vazio!',
        check: (c) => uses(c.raw('C5'), 'B5', 'B2') && c.sel.is('C5'),
        solve: (v) => { v.selectRange('C4:C6'); v.fillDown('C4:C6'); v.selectRange('C5'); },
        win: 'Aí está o bug: B2 está vazio, então o desconto virou zero e o preço não mudou (C5 = 150). Vamos consertar.'
      },
      {
        title: 'O cifrão $ trava a célula',
        say: '<p>Coloque <code>$</code> antes da letra e do número para <strong>travar</strong> o endereço: <code>$B$1</code>. Quando a fórmula é copiada, o <code>$B$1</code> não se mexe.</p><p>Atalho no Excel de verdade: com o cursor no endereço, aperte <kbd>F4</kbd> e ele põe os cifrões sozinho.</p>',
        draw: D.grid({ cols: 3, rows: 6, cells: { B1: '10%', C4: '=B4*(1-$B$1)', C5: '=B5*(1-$B$1)', C6: '=B6*(1-$B$1)' }, hl2: ['B1'], hl: ['C4:C6'], notes: [{ at: 'C4:C6', text: '$B$1 fica parado,\nB4→B5→B6 anda', side: 'right' }] }),
        sheet: { cols: 4, rows: 7, data: Object.assign(T([['Desconto', '10%'], [], ['Produto', 'Preço', 'Com desc.'], ['Camiseta', 80, '=B4*(1-B1)'], ['Calça', 150, '=B5*(1-B2)'], ['Tênis', 200, '=B6*(1-B3)']])), tools: ['fill'], sel: 'C4' }, hl: ['C4'],
        task: 'Corrija <strong>C4</strong> para <code>=B4*(1-$B$1)</code>, depois selecione <strong>C4:C6</strong> e preencha para baixo.',
        hint: 'Troque B1 por $B$1 (em vez de digitar o $, aperte F4 depois de B1). Depois: arraste C4:C6 → ⬇ Preencher.',
        check: (c) => uses(c.raw('C4'), '$B$1') && c.v('C5') === 135 && c.v('C6') === 180,
        solve: (v) => { v.setCell('C4', '=B4*(1-$B$1)'); v.selectRange('C4:C6'); v.fillDown('C4:C6'); },
        win: 'Camiseta R$ 72, calça R$ 135, tênis R$ 180. Experimente mudar o desconto em B1: tudo recalcula!'
      }
    ]
  });

  LESSONS.push({
    id: 'texto', trail: 't2', title: 'Trabalhando com texto', time: '6 min',
    intro: 'Excel não é só número. Dá para juntar, cortar e arrumar textos — ótimo para limpar listas de clientes.',
    steps: [
      {
        title: 'Juntar textos com &',
        say: '<p>O sinal <code>&amp;</code> cola textos. Para colocar um espaço no meio, use aspas: <code>" "</code>. Textos fixos na fórmula sempre ficam entre aspas.</p>',
        draw: D.grid({ cols: 3, rows: 3, cells: { A1: 'Ana', B1: 'Souza', C1: '=A1&" "&B1', A2: '', B2: '', }, hl: ['C1'], hl2: ['A1', 'B1'], notes: [{ at: 'C1', text: 'junta A1, um espaço\ne B1', side: 'right' }, { at: 'C2', text: 'resultado:  Ana Souza', side: 'bottom' }] }),
        sheet: { cols: 4, rows: 5, data: T([['Nome', 'Sobrenome', 'Completo'], ['Ana', 'Souza'], ['Bruno', 'Lima']]), sel: 'C2' }, hl: ['C2'],
        task: 'Em <strong>C2</strong>, junte nome e sobrenome com um espaço no meio: <code>=A2&amp;" "&amp;B2</code>.',
        hint: 'Aspas, espaço, aspas: " ". Fica =A2&" "&B2',
        check: (c) => uses(c.raw('C2'), 'A2', 'B2', '&') && c.v('C2') === 'Ana Souza',
        solve: (v) => v.setCell('C2', '=A2&" "&B2'),
        win: '“Ana Souza” montado automaticamente.'
      },
      {
        title: 'Arrumar maiúsculas e minúsculas',
        say: '<p>Lista de clientes bagunçada? <code>MAIÚSCULA</code> deixa tudo em CAIXA ALTA, <code>MINÚSCULA</code> em caixa baixa e <code>PRI.MAIÚSCULA</code> coloca a primeira letra de cada palavra em maiúscula.</p>',
        draw: D.pair({ cols: 2, rows: 2, w: 110, cells: { A1: 'mARIA dA silva', A2: 'jOÃO pEDRO' }, hl: ['A1:A2'] }, { cols: 2, rows: 2, w: 110, cells: { A1: 'Maria Da Silva', A2: 'João Pedro' }, hl: ['A1:A2'] }, '=PRI.MAIÚSCULA(…)'),
        sheet: { cols: 4, rows: 5, data: T([['Bagunçado', 'Arrumado'], ['mARIA dA silva'], ['jOÃO pEDRO']]), colW: [130, 130, 80, 80], sel: 'B2' }, hl: ['B2'],
        task: 'Em <strong>B2</strong>, arrume o nome: <code>=PRI.MAIÚSCULA(A2)</code>.',
        hint: 'Digite =PRI.MAIÚSCULA( clique na A2 e feche o parêntese.',
        check: (c) => uses(c.raw('B2'), 'PRI.MAIUSCULA', 'A2') && c.v('B2') === 'Maria Da Silva',
        solve: (v) => v.setCell('B2', '=PRI.MAIÚSCULA(A2)'),
        win: 'Primeira trilha de funções de texto concluída. Em sistemas reais, isso salva horas de limpeza.'
      }
    ]
  });

  /* ========================================================= T3 */
  LESSONS.push({
    id: 'se', trail: 't3', title: 'A função SE', time: '12 min',
    intro: 'Com a função SE, a planilha toma decisões: “se isso for verdade, mostre X; senão, mostre Y”.',
    steps: [
      {
        title: 'O SE em três partes',
        say: '<p><code>=SE(teste; se_verdadeiro; se_falso)</code></p><p>Três partes, separadas por <strong>ponto e vírgula</strong> (<code>;</code>) no Excel em português. O texto que a função devolve vai entre aspas.</p>',
        draw: D.flow([{ t: '1. TESTE\nB2>=6 ?', cls: 'g' }, { t: '2. se SIM\n"Aprovado"', cls: 'ok' }, { t: '3. se NÃO\n"Reprovado"', cls: 'no' }], { bw: 150, gap: 50, h: 110 }),
        sheet: { cols: 4, rows: 6, data: T([['Aluno', 'Nota', 'Situação'], ['Ana', 7], ['Bruno', 5], ['Carla', 9], ['Diego', 4]]), sel: 'C2' }, hl: ['C2'],
        task: 'Em <strong>C2</strong> escreva: <code>=SE(B2&gt;=6;"Aprovado";"Reprovado")</code>',
        hint: 'Cuidado com as aspas e com o ponto e vírgula entre as partes. >= quer dizer “maior ou igual”.',
        check: (c) => uses(c.raw('C2'), 'SE(', 'B2') && c.v('C2') === 'Aprovado' && works(c, { B2: 3 }, 'C2', 'Reprovado'),
        solve: (v) => v.setCell('C2', '=SE(B2>=6;"Aprovado";"Reprovado")'),
        win: 'A Ana (nota 7) foi aprovada. Fórmula conferida: se a nota mudar para 3, vira Reprovado!'
      },
      {
        title: 'Aplicando para toda a turma',
        say: '<p>Já sabemos copiar fórmulas: selecione a célula pronta e as de baixo, e <strong>preencha para baixo</strong>.</p>',
        draw: D.grid({ cols: 3, rows: 5, cells: { A1: 'Aluno', B1: 'Nota', C1: 'Situação', A2: 'Ana', B2: '7', C2: 'Aprovado', A3: 'Bruno', B3: '5', C3: 'Reprovado', A4: 'Carla', B4: '9', C4: 'Aprovado', A5: 'Diego', B5: '4', C5: 'Reprovado' }, w: 90, hl: ['C2:C5'] }),
        sheet: { cols: 4, rows: 6, data: Object.assign(T([['Aluno', 'Nota', 'Situação'], ['Ana', 7], ['Bruno', 5], ['Carla', 9], ['Diego', 4]]), { C2: '=SE(B2>=6;"Aprovado";"Reprovado")' }), tools: ['fill'], sel: 'C2' }, hl: ['C2:C5'],
        task: 'Selecione <strong>C2:C5</strong> e preencha para baixo.',
        hint: 'Arraste de C2 até C5 e clique em ⬇ Preencher.',
        check: (c) => c.v('C3') === 'Reprovado' && c.v('C4') === 'Aprovado' && c.v('C5') === 'Reprovado',
        solve: (v) => { v.selectRange('C2:C5'); v.fillDown('C2:C5'); },
        win: 'Toda a turma avaliada de uma vez.'
      },
      {
        title: 'Duas condições: E e OU',
        say: '<p>Às vezes são <strong>duas regras</strong>. Use <code>E(...)</code> quando <em>todas</em> precisam ser verdadeiras, e <code>OU(...)</code> quando <em>basta uma</em>.</p><p>Exemplo: aprovado se nota ≥ 6 <strong>E</strong> faltas ≤ 10: <code>=SE(E(B2&gt;=6;C2&lt;=10);"Aprovado";"Reprovado")</code></p>',
        draw: D.flow([{ t: 'nota ≥ 6', cls: 'g' }, { t: 'E (as duas\nprecisam ser\nverdade)', cls: 'o', arrow: '' }, { t: 'faltas ≤ 10', cls: 'g' }], { bw: 150, gap: 40, h: 110 }),
        sheet: { cols: 5, rows: 6, data: T([['Aluno', 'Nota', 'Faltas', 'Resultado'], ['Ana', 8, 2], ['Bruno', 7, 15], ['Carla', 5, 0]]), tools: ['fill'], sel: 'D2' }, hl: ['D2:D4'],
        task: 'Em <strong>D2</strong>, use SE com E para aprovar só quem tem nota ≥ 6 <u>e</u> faltas ≤ 10. Depois preencha até <strong>D4</strong>.',
        hint: '=SE(E(B2>=6;C2<=10);"Aprovado";"Reprovado") e depois selecione D2:D4 → ⬇ Preencher.',
        check: (c) => uses(c.raw('D2'), 'SE(', 'E(') && c.v('D2') === 'Aprovado' && c.v('D3') === 'Reprovado' && c.v('D4') === 'Reprovado',
        solve: (v) => { v.setCell('D2', '=SE(E(B2>=6;C2<=10);"Aprovado";"Reprovado")'); v.selectRange('D2:D4'); v.fillDown('D2:D4'); },
        win: 'Bruno tem boa nota, mas 15 faltas: reprovado. A Carla faltou 0 vezes, mas a nota é 5: reprovada. Só a Ana passa nos dois testes.'
      }
    ]
  });

  const VENDAS = T([['Vendedor', 'Região', 'Valor'], ['Ana', 'Sul', 100], ['Bruno', 'Norte', 200], ['Ana', 'Norte', 150], ['Carla', 'Sul', 300], ['Bruno', 'Sul', 50], ['Ana', 'Sul', 120]]);
  LESSONS.push({
    id: 'criterios', trail: 't3', title: 'Contar e somar com critério', time: '10 min',
    intro: 'Quantas vendas a Ana fez? Quanto ela vendeu no total? Duas perguntas que todo chefe faz.',
    steps: [
      {
        title: 'CONT.SE: quantas vezes aparece',
        say: '<p><code>=CONT.SE(onde_procurar; critério)</code> conta quantas células combinam com o critério.</p>',
        draw: D.grid({ cols: 3, rows: 7, cells: { A1: 'Vendedor', B1: 'Região', C1: 'Valor', A2: 'Ana', A3: 'Bruno', A4: 'Ana', A5: 'Carla', A6: 'Bruno', A7: 'Ana' }, hl2: ['A2', 'A4', 'A7'], hl: ['A2:A7'], notes: [{ at: 'A2:A7', text: '=CONT.SE(A2:A7;"Ana")\n→ 3', side: 'right' }] }),
        sheet: { cols: 4, rows: 10, data: Object.assign({ A9: 'Vendas da Ana' }, VENDAS), colW: [120, 90, 90, 90], sel: 'B9' }, hl: ['B9'],
        task: 'Em <strong>B9</strong>, conte quantas vendas são da Ana: <code>=CONT.SE(A2:A7;"Ana")</code>.',
        hint: 'Primeiro o intervalo onde procurar, depois ; e o que procurar entre aspas.',
        check: (c) => uses(c.raw('B9'), 'CONT.SE', 'A2:A7') && c.v('B9') === 3,
        solve: (v) => v.setCell('B9', '=CONT.SE(A2:A7;"Ana")'),
        win: 'A Ana aparece 3 vezes.'
      },
      {
        title: 'SOMASE: somar só o que combina',
        say: '<p><code>=SOMASE(onde_procurar; critério; o_que_somar)</code> soma os valores <strong>apenas das linhas</strong> em que o critério é verdadeiro.</p>',
        draw: D.flow([{ t: 'Procure "Ana"\nna coluna A', cls: 'g' }, { t: 'nas linhas\nencontradas…', cls: 'o' }, { t: '…some a\ncoluna C', cls: 'ok' }], { bw: 150, gap: 40, h: 110 }),
        sheet: { cols: 4, rows: 11, data: Object.assign({ A9: 'Vendas da Ana', B9: '=CONT.SE(A2:A7;"Ana")', A10: 'Total da Ana' }, VENDAS), colW: [120, 90, 90, 90], sel: 'B10' }, hl: ['B10'],
        task: 'Em <strong>B10</strong>, some o valor vendido pela Ana: <code>=SOMASE(A2:A7;"Ana";C2:C7)</code>.',
        hint: 'Três partes: onde procurar (A2:A7), o que procurar ("Ana") e o que somar (C2:C7).',
        check: (c) => uses(c.raw('B10'), 'SOMASE', 'A2:A7', 'C2:C7') && c.v('B10') === 370,
        solve: (v) => v.setCell('B10', '=SOMASE(A2:A7;"Ana";C2:C7)'),
        win: 'A Ana vendeu 100 + 150 + 120 = R$ 370.'
      },
      {
        title: 'Critérios com > e <',
        say: '<p>O critério também pode ser uma comparação. Escreva-a <strong>entre aspas</strong>: <code>"&gt;100"</code>, <code>"&lt;=50"</code>, <code>"&lt;&gt;Sul"</code> (diferente de Sul).</p>',
        draw: D.grid({ cols: 3, rows: 7, cells: { C1: 'Valor', C2: '100', C3: '200', C4: '150', C5: '300', C6: '50', C7: '120' }, hl2: ['C3', 'C4', 'C5', 'C7'], hl: ['C2:C7'], notes: [{ at: 'C2:C7', text: '=CONT.SE(C2:C7;">100")\n→ 4 vendas', side: 'right' }] }),
        sheet: { cols: 4, rows: 12, data: Object.assign({ A9: 'Vendas da Ana', B9: '=CONT.SE(A2:A7;"Ana")', A10: 'Total da Ana', B10: '=SOMASE(A2:A7;"Ana";C2:C7)', A11: 'Acima de 100' }, VENDAS), colW: [120, 90, 90, 90], sel: 'B11' }, hl: ['B11'],
        task: 'Em <strong>B11</strong>, conte quantas vendas foram <strong>acima de 100</strong>: <code>=CONT.SE(C2:C7;"&gt;100")</code>.',
        hint: 'O critério inteiro vai entre aspas, com o sinal: ">100"',
        check: (c) => uses(c.raw('B11'), 'CONT.SE', 'C2:C7', '">100"') && c.v('B11') === 4,
        solve: (v) => v.setCell('B11', '=CONT.SE(C2:C7;">100")'),
        win: '4 vendas acima de R$ 100. Você acabou de aprender a fazer relatórios.'
      }
    ]
  });

  /* ========================================================= T4 */
  const CAT = T([['Código', 'Produto', 'Preço'], [101, 'Caneta', 3], [102, 'Caderno', 20], [103, 'Mochila', 80], [104, 'Régua', 5]]);
  const CAT_SHEET = (extra) => Object.assign({ E1: 'Código:', F1: 103, E2: 'Produto:', E3: 'Preço:' }, CAT, extra || {});
  LESSONS.push({
    id: 'procv', trail: 't4', title: 'PROCV e PROCX', time: '14 min',
    intro: 'Você tem um catálogo grande e quer buscar o preço de um código. Em vez de procurar com os olhos, o Excel procura para você.',
    steps: [
      {
        title: 'Como a busca funciona',
        say: '<p>É igual à lista telefônica: você sabe o <strong>nome</strong> e quer o <strong>telefone</strong>. O Excel procura o valor na primeira coluna da tabela e devolve outra informação <em>da mesma linha</em>.</p>',
        draw: D.grid({ cols: 3, rows: 5, cells: { A1: 'Código', B1: 'Produto', C1: 'Preço', A2: '101', B2: 'Caneta', C2: '3', A3: '102', B3: 'Caderno', C3: '20', A4: '103', B4: 'Mochila', C4: '80', A5: '104', B5: 'Régua', C5: '5' }, hl: ['A4'], hl2: ['B4:C4'], notes: [{ at: 'A4', text: '1) acha o 103', side: 'left' }, { at: 'C4', text: '2) devolve o dado\nda mesma linha', side: 'right', cls: 'b' }] }),
        quiz: { q: 'Você tem o código 103 e quer saber o preço. O que a busca (PROCV/PROCX) faz?', options: ['Soma todos os preços da tabela', 'Acha o 103 e devolve o preço que está na mesma linha dele', 'Ordena a tabela pelos códigos', 'Conta quantas vezes o 103 aparece'], correct: 1, why: 'Exatamente: procurar o código, e trazer outra coluna da mesma linha. É o “cruzamento” mais usado do Excel.' },
        win: ''
      },
      {
        title: 'PROCV: o clássico',
        say: '<p><code>=PROCV(o_que_procurar; tabela; nº_da_coluna; FALSO)</code></p><ul><li><strong>o que procurar</strong>: aqui, a célula F1 (código).</li><li><strong>tabela</strong>: A2:C5 — o código <em>precisa</em> estar na 1ª coluna.</li><li><strong>nº da coluna</strong>: 2 = Produto (a 2ª coluna da tabela).</li><li><strong>FALSO</strong>: busca exata (use sempre!).</li></ul>',
        draw: D.grid({ cols: 6, rows: 5, w: 64, cells: { A1: 'Código', B1: 'Produto', C1: 'Preço', A4: '103', B4: 'Mochila', E1: 'Código:', F1: '103', E2: 'Produto:', F2: '=PROCV(F1;A2:C5;2;FALSO)' }, hl: ['F2'], hl2: ['F1', 'A2:C5'], notes: [{ at: 'F2', text: 'coluna 2 da tabela', side: 'bottom' }] }),
        sheet: { cols: 6, rows: 7, data: CAT_SHEET(), colW: [70, 90, 70, 20, 80, 90], sel: 'F2' }, hl: ['F2'],
        task: 'Em <strong>F2</strong>, descubra o produto do código que está em F1: <code>=PROCV(F1;A2:C5;2;FALSO)</code>.',
        hint: 'Atenção às 4 partes: F1 ; A2:C5 ; 2 ; FALSO',
        check: (c) => uses(c.raw('F2'), 'PROCV', 'F1', 'A2:C5') && c.v('F2') === 'Mochila' && works(c, { F1: 101 }, 'F2', 'Caneta'),
        solve: (v) => v.setCell('F2', '=PROCV(F1;A2:C5;2;FALSO)'),
        win: 'Mochila! E conferi: se o código mudar para 101, a fórmula devolve “Caneta”.'
      },
      {
        title: 'Trazendo outra coluna',
        say: '<p>Para trazer o <strong>preço</strong>, é a mesma fórmula, só muda o número da coluna: o preço é a <strong>3ª</strong> coluna da tabela.</p>',
        draw: D.grid({ cols: 6, rows: 3, w: 64, cells: { E1: 'Código:', F1: '103', E2: 'Produto:', F2: 'Mochila', E3: 'Preço:', F3: '=PROCV(F1;A2:C5;3;FALSO)' }, hl: ['F3'], notes: [{ at: 'F3', text: 'agora coluna 3', side: 'bottom' }] }),
        sheet: { cols: 6, rows: 7, data: CAT_SHEET({ F2: '=PROCV(F1;A2:C5;2;FALSO)' }), colW: [70, 90, 70, 20, 80, 90], sel: 'F3' }, hl: ['F3'],
        task: 'Em <strong>F3</strong>, traga o preço: <code>=PROCV(F1;A2:C5;3;FALSO)</code>. Depois teste trocando o código em F1.',
        hint: 'Copie a fórmula de F2 e troque o 2 por 3.',
        check: (c) => uses(c.raw('F3'), 'PROCV', 'F1') && c.v('F3') === 80 && works(c, { F1: 102 }, 'F3', 20),
        solve: (v) => v.setCell('F3', '=PROCV(F1;A2:C5;3;FALSO)'),
        win: 'R$ 80. Troque F1 para 104 e veja a Régua aparecer.'
      },
      {
        title: 'PROCX: o sucessor moderno',
        say: '<p>Como você tem Microsoft 365, pode usar o <strong>PROCX</strong>, que é mais simples e poderoso: você aponta <em>onde procurar</em> e <em>de onde trazer</em>, sem contar colunas.</p><p><code>=PROCX(o_que_procurar; onde_procurar; de_onde_trazer)</code></p><p>Ele já faz busca exata por padrão, e pode procurar para a esquerda (o PROCV não!).</p>',
        draw: D.flow([{ t: 'F1\n(103)', cls: 'g' }, { t: 'procura em\nA2:A5', cls: 'o' }, { t: 'devolve de\nB2:B5', cls: 'ok' }], { bw: 130, gap: 50, h: 110 }),
        sheet: { cols: 6, rows: 7, data: CAT_SHEET(), colW: [70, 90, 70, 20, 80, 90], sel: 'F2' }, hl: ['F2'],
        task: 'Em <strong>F2</strong>, descubra o produto com PROCX: <code>=PROCX(F1;A2:A5;B2:B5)</code>.',
        hint: 'Procurar F1 dentro de A2:A5 e trazer o que está em B2:B5.',
        check: (c) => uses(c.raw('F2'), 'PROCX', 'F1') && c.v('F2') === 'Mochila' && works(c, { F1: 104 }, 'F2', 'Régua'),
        solve: (v) => v.setCell('F2', '=PROCX(F1;A2:A5;B2:B5)'),
        win: 'Mesmo resultado, fórmula mais fácil de ler. Use PROCX sempre que seu Excel tiver.'
      },
      {
        title: 'Evitando #N/D com SEERRO',
        say: '<p>Se o código não existe, a busca dá <code>#N/D</code> (não disponível). Para mostrar algo amigável, envolva a fórmula com <code>SEERRO(fórmula; "mensagem")</code>.</p>',
        draw: D.flow([{ t: '#N/D\n(feio)', cls: 'no' }, { t: 'SEERRO(…;\n"Não achei")', cls: 'o' }, { t: 'Não achei\n(amigável)', cls: 'ok' }], { bw: 140, gap: 46, h: 110 }),
        sheet: { cols: 6, rows: 7, data: CAT_SHEET({ F1: 999, F2: '=PROCX(F1;A2:A5;B2:B5)' }), colW: [70, 90, 70, 20, 80, 90], sel: 'F2' }, hl: ['F2'],
        task: 'O código 999 não existe. Em <strong>F2</strong>, envolva a fórmula: <code>=SEERRO(PROCX(F1;A2:A5;B2:B5);"Não encontrado")</code>.',
        hint: 'SEERRO( + a fórmula inteira + ; + "Não encontrado" + )',
        check: (c) => uses(c.raw('F2'), 'SEERRO', 'PROCX') && c.v('F2') === 'Não encontrado' && works(c, { F1: 101 }, 'F2', 'Caneta'),
        solve: (v) => v.setCell('F2', '=SEERRO(PROCX(F1;A2:A5;B2:B5);"Não encontrado")'),
        win: 'Mensagem amigável quando não acha, e funciona normal quando acha. Fim da trilha de buscas!'
      }
    ]
  });

  /* ========================================================= T5 */
  const MESES = T([['Mês', 'Vendas'], ['Jan', 1200], ['Fev', 1500], ['Mar', 900], ['Abr', 1800], ['Mai', 2100], ['Jun', 1700]]);
  LESSONS.push({
    id: 'tabelas', trail: 't5', title: 'Organizar, ordenar e criar gráficos', time: '14 min',
    intro: 'Dados bem organizados rendem relatórios e gráficos em poucos cliques.',
    steps: [
      {
        title: 'O jeito certo de montar uma tabela',
        say: '<p>Antes de qualquer análise, os dados precisam estar bem arrumados:</p><ul><li>Uma <strong>linha = um registro</strong> (uma venda, um cliente…).</li><li>Uma <strong>coluna = um tipo de informação</strong>, com título na primeira linha.</li><li><strong>Sem linhas ou colunas em branco</strong> no meio, e sem células mescladas.</li></ul>',
        draw: D.pair({ cols: 3, rows: 4, w: 78, cells: { A1: 'Vendas Jan', C1: 'Ana: 10', A3: 'Bruno', B3: '8 | 5' }, hl2: ['A2:C2'], notes: [{ at: 'A4:C4', text: '✗ bagunçado', side: 'bottom', cls: 'b' }] }, { cols: 3, rows: 4, w: 78, cells: { A1: 'Vendedor', B1: 'Mês', C1: 'Valor', A2: 'Ana', B2: 'Jan', C2: '10', A3: 'Bruno', B3: 'Jan', C3: '8', A4: 'Bruno', B4: 'Fev', C4: '5' }, bold: ['A1', 'B1', 'C1'], notes: [{ at: 'A4:C4', text: '✓ organizado', side: 'bottom' }] }, 'arrume'),
        quiz: { q: 'Qual destas é uma boa regra para uma tabela de dados no Excel?', options: ['Deixar uma linha em branco entre os grupos para ficar bonito', 'Mesclar células para os títulos ficarem centralizados', 'Um registro por linha, um tipo de informação por coluna, com título na primeira linha', 'Misturar texto e números na mesma coluna'], correct: 2, why: 'Dados organizados desse jeito funcionam com ordenação, filtros, tabelas dinâmicas e gráficos sem dor de cabeça. Linhas em branco e mesclagens quebram tudo isso.' }
      },
      {
        title: 'Ordenar do maior para o menor',
        say: '<p>Para ordenar, clique em uma célula da coluna que vai guiar a ordem e use <strong>A→Z</strong> (crescente) ou <strong>Z→A</strong> (decrescente). Os números ordenam do menor para o maior em A→Z.</p><p>No Excel: <em>Dados &gt; Classificar</em>, ou o botão de filtro no cabeçalho.</p>',
        draw: D.pair({ cols: 2, rows: 4, cells: { A1: 'Mês', B1: 'Vendas', A2: 'Jan', B2: '1200', A3: 'Fev', B3: '1500', A4: 'Mar', B4: '900' }, hl: ['B2:B4'] }, { cols: 2, rows: 4, cells: { A1: 'Mês', B1: 'Vendas', A2: 'Fev', B2: '1500', A3: 'Jan', B3: '1200', A4: 'Mar', B4: '900' }, hl: ['B2:B4'] }, 'Z→A'),
        sheet: { cols: 3, rows: 8, data: MESES, table: { c1: 1, c2: 2, r1: 2, r2: 7 }, tools: ['sortAZ', 'sortZA'], sel: 'B2' }, hl: ['B2:B7'],
        task: 'Descubra o mês que mais vendeu: ordene a tabela pela coluna <strong>Vendas</strong> do <strong>maior para o menor</strong> (<strong>Z→A</strong>).',
        hint: 'Clique em qualquer célula da coluna B e use o botão Z→A. A linha inteira acompanha!',
        check: (c) => c.v('B2') === 2100 && c.v('A2') === 'Mai' && c.v('B7') === 900,
        solve: (v) => { v.selectRange('B2'); v.sort('B', 'desc'); },
        win: 'Maio vendeu mais (2100). Repare que Mês e Vendas andaram juntos: cada linha continua inteira.'
      },
      {
        title: 'Gráfico de colunas',
        say: '<p>Gráfico é só: <strong>selecionar os dados + escolher o tipo</strong>. Inclua o <em>cabeçalho</em> (para ter nomes) e a coluna de rótulos (meses).</p><p>No Excel: <em>Inserir &gt; Gráficos</em> — ou, com os dados selecionados, <kbd>Alt</kbd>+<kbd>F1</kbd> cria um gráfico na hora.</p>',
        draw: D.grid({ cols: 3, rows: 7, cells: { A1: 'Mês', B1: 'Vendas', A2: 'Jan', B2: '1200', A3: 'Fev', B3: '1500', A4: 'Mar', B4: '900', A5: 'Abr', B5: '1800', A6: 'Mai', B6: '2100', A7: 'Jun', B7: '1700' }, hl: ['A1:B7'], notes: [{ at: 'A1:B7', text: '1) selecione tudo,\ncom o cabeçalho', side: 'right' }] }),
        sheet: { cols: 6, rows: 8, data: MESES, tools: ['chartCol', 'chartLine', 'chartPie'], sel: 'A1' }, hl: ['A1:B7'],
        task: 'Selecione <strong>A1:B7</strong> (arraste) e clique em <strong>📊 Colunas</strong>.',
        hint: 'Arraste de A1 até B7 e clique em 📊 Colunas.',
        check: (c) => c.chart && c.chart.type === 'col' && c.chart.range === 'A1:B7' ? true : (c.chart && c.chart.type === 'col' ? 'O gráfico foi criado, mas selecione <strong>A1:B7</strong> (meses + vendas, com o cabeçalho).' : false),
        solve: (v) => { v.selectRange('A1:B7'); v.makeChart('col', 'A1:B7'); },
        win: 'Seu primeiro gráfico! Colunas são ótimas para comparar valores entre categorias.'
      },
      {
        title: 'Qual gráfico usar? (e a pizza)',
        say: '<p><strong>Colunas</strong>: comparar categorias. <strong>Linhas</strong>: mostrar evolução no tempo. <strong>Pizza</strong>: mostrar como um todo se divide em partes (use com poucas fatias, até 5).</p>',
        draw: D.grid({ cols: 3, rows: 4, cells: { A1: 'Região', B1: 'Vendas', A2: 'Sul', B2: '520', A3: 'Norte', B3: '350', A4: 'Leste', B4: '130' }, hl: ['A1:B4'], notes: [{ at: 'A1:B4', text: 'partes de um\ntodo → pizza', side: 'right' }] }),
        sheet: { cols: 6, rows: 6, data: T([['Região', 'Vendas'], ['Sul', 520], ['Norte', 350], ['Leste', 130]]), tools: ['chartCol', 'chartLine', 'chartPie'], sel: 'A1' }, hl: ['A1:B4'],
        task: 'Mostre a <strong>participação de cada região</strong> nas vendas: selecione <strong>A1:B4</strong> e crie um gráfico de <strong>🥧 Pizza</strong>.',
        hint: 'Arraste A1:B4 e clique em 🥧 Pizza.',
        check: (c) => c.chart && c.chart.type === 'pie' && c.chart.range === 'A1:B4',
        solve: (v) => { v.selectRange('A1:B4'); v.makeChart('pie', 'A1:B4'); },
        win: 'O Sul tem mais da metade (52%). Fim da aula: agora você organiza, ordena e visualiza.'
      }
    ]
  });

  const PIV_ROWS = [
    ['Ana', 'Sul', 'Caneta', 100], ['Bruno', 'Norte', 'Caderno', 200], ['Ana', 'Norte', 'Caderno', 150], ['Carla', 'Sul', 'Mochila', 300],
    ['Bruno', 'Sul', 'Caneta', 50], ['Ana', 'Sul', 'Mochila', 120], ['Carla', 'Norte', 'Caneta', 80], ['Bruno', 'Norte', 'Mochila', 250]
  ];
  const PIV = { fields: [{ name: 'Vendedor', type: 'text' }, { name: 'Região', type: 'text' }, { name: 'Produto', type: 'text' }, { name: 'Valor', type: 'num' }], rows: PIV_ROWS };
  LESSONS.push({
    id: 'dinamica', trail: 't5', title: 'Tabela dinâmica', time: '12 min',
    intro: 'A tabela dinâmica é a ferramenta mais poderosa para análise rápida: resume milhares de linhas em segundos, sem escrever fórmula.',
    steps: [
      {
        title: 'Resumindo vendas por vendedor',
        say: '<p>Em vez de fazer SOMASE para cada pessoa, você <strong>monta</strong> o resumo arrastando campos:</p><ul><li><strong>Linhas</strong>: o que vira as linhas do resumo (ex.: vendedor).</li><li><strong>Valores</strong>: o número que será calculado (ex.: soma do valor).</li></ul><p>Aqui, clique nos campos para colocá-los nas áreas (ou arraste).</p>',
        draw: D.pair({ cols: 4, rows: 5, w: 64, cells: { A1: 'Vendedor', B1: 'Região', C1: 'Produto', D1: 'Valor', A2: 'Ana', B2: 'Sul', C2: 'Caneta', D2: '100', A3: 'Bruno', D3: '200', A4: 'Ana', D4: '150', A5: '…', D5: '…' }, hl: ['A1:A5', 'D1:D5'] }, { cols: 2, rows: 4, w: 90, cells: { A1: 'Vendedor', B1: 'Soma de Valor', A2: 'Ana', B2: '370', A3: 'Bruno', B3: '500', A4: 'Carla', B4: '380' }, bold: ['A1', 'B1'] }, 'tabela dinâmica'),
        pivot: PIV,
        task: 'Coloque <strong>Vendedor</strong> em <strong>Linhas</strong> e <strong>Valor</strong> em <strong>Valores</strong> (operação: Soma).',
        hint: 'Clique em “Vendedor” e depois em “Valor” na lista de campos. Escolha Soma.',
        check: (c) => c.pivot && c.pivot.row === 'Vendedor' && c.pivot.val === 'Valor' && c.pivot.op === 'SOMA',
        solve: (w) => w.set({ row: 'Vendedor', val: 'Valor', op: 'SOMA' }),
        win: 'Ana 370, Bruno 500, Carla 380. Sem digitar uma fórmula! Se os dados mudarem, você só clica em “Atualizar”.'
      },
      {
        title: 'Mudando a pergunta',
        say: '<p>A graça é <strong>trocar a pergunta em segundos</strong>. Agora queremos saber <em>quantas vendas</em> cada região teve. Ao invés de Soma, use <strong>Contagem</strong>.</p>',
        draw: D.grid({ cols: 3, rows: 4, w: 100, cells: { A1: 'Região', B1: 'Contagem', A2: 'Norte', B2: '4', A3: 'Sul', B3: '4' }, bold: ['A1', 'B1'], hl: ['B2:B3'], notes: [{ at: 'B2:B3', text: 'contar linhas,\nnão somar dinheiro', side: 'right' }] }),
        pivot: PIV,
        task: 'Mostre <strong>quantas vendas</strong> teve cada região: <strong>Região</strong> em Linhas, <strong>Valor</strong> em Valores com <strong>Contagem</strong>.',
        hint: 'Clique em Região e em Valor; depois troque Soma por Contagem.',
        check: (c) => c.pivot && c.pivot.row === 'Região' && c.pivot.val === 'Valor' && c.pivot.op === 'CONT',
        solve: (w) => w.set({ row: 'Região', val: 'Valor', op: 'CONT' }),
        win: 'Cada região com 4 vendas. Soma, Contagem e Média cobrem a maioria das análises.'
      },
      {
        title: 'Agora no seu Excel de verdade',
        say: '<p>Hora de repetir no Excel do seu computador. Eu não consigo ver a sua tela, então marque cada item conforme for fazendo.</p>',
        draw: D.flow([{ t: 'Selecione\na tabela', cls: 'g' }, { t: 'Inserir >\nTabela Dinâmica', cls: 'o' }, { t: 'Arraste os\ncampos', cls: 'ok' }], { bw: 140, gap: 46, h: 110 }),
        real: {
          items: ['Copie os dados abaixo (botão “Copiar dados”) e cole na célula A1 de uma planilha nova.', 'Clique em qualquer célula dos dados e vá em <strong>Inserir &gt; Tabela Dinâmica</strong> &gt; OK.', 'Arraste <strong>Vendedor</strong> para Linhas e <strong>Valor</strong> para Valores. Você deve ver Ana 370, Bruno 500 e Carla 380.', 'Arraste <strong>Região</strong> para Colunas e veja o cruzamento vendedor × região.'],
          data: tsv([['Vendedor', 'Região', 'Produto', 'Valor']].concat(PIV_ROWS))
        }
      }
    ]
  });

  /* ========================================================= T6 */
  const SUJO = [['Nome', 'Cidade', 'Valor'], ['  ana souza ', 'são paulo', 120], ['BRUNO LIMA', 'Rio ', 80], ['', '', ''], ['carla dias', 'SÃO PAULO', 200], ['bruno lima', 'rio', 80], ['diego melo', 'belo horizonte', 150]];
  LESSONS.push({
    id: 'avancado', trail: 't6', title: 'Power Query, funções dinâmicas e macros', time: '25 min',
    intro: 'O nível avançado. Aqui você usa o Excel no seu computador (as ferramentas são grandes demais para simular) e eu guio cada passo.',
    steps: [
      {
        title: 'Para que serve o Power Query?',
        say: '<p>O <strong>Power Query</strong> (aba Dados &gt; Obter e Transformar) é um “robô de limpeza”. Você ensina uma vez como limpar os dados (tirar espaços, remover linhas em branco, apagar duplicados) e, quando chegam dados novos, é só clicar em <strong>Atualizar</strong>.</p>',
        draw: D.flow([{ t: 'Dados\nbagunçados', cls: 'no' }, { t: 'Power Query\n(receita de limpeza)', cls: 'o' }, { t: 'Tabela limpa\ne atualizável', cls: 'ok' }], { bw: 150, gap: 48, h: 110 }),
        quiz: { q: 'Todo mês você recebe a mesma planilha bagunçada e gasta 1 hora limpando do mesmo jeito. Qual ferramenta resolve?', options: ['Formatação condicional', 'Power Query: grava os passos de limpeza e repete com um clique', 'Gráfico de pizza', 'Congelar painéis'], correct: 1, why: 'É exatamente isso: você grava a receita uma vez e repete com “Atualizar”.' }
      },
      {
        title: 'Limpando dados com Power Query',
        say: '<p>Vamos limpar esta lista: nomes com espaços e caixa errada, uma linha vazia e uma pessoa duplicada (Bruno Lima).</p>',
        draw: D.pair({ cols: 3, rows: 5, w: 74, cells: { A1: 'Nome', B1: 'Cidade', A2: '  ana souza ', B2: 'são paulo', A3: 'BRUNO LIMA', B3: 'Rio ', A5: 'bruno lima', B5: 'rio' }, hl2: ['A4:C4'] }, { cols: 3, rows: 5, w: 74, cells: { A1: 'Nome', B1: 'Cidade', A2: 'Ana Souza', B2: 'São Paulo', A3: 'Bruno Lima', B3: 'Rio' }, bold: ['A1', 'B1'] }, 'Power Query'),
        real: {
          items: ['Copie os dados abaixo e cole na A1 de uma planilha nova.', 'Clique em uma célula dos dados &gt; aba <strong>Dados</strong> &gt; <strong>De Tabela/Intervalo</strong> (marque “Minha tabela tem cabeçalhos”).', 'No editor, selecione as colunas Nome e Cidade &gt; botão direito &gt; <strong>Transformar &gt; Cortar Texto</strong> (tira espaços) e depois <strong>Transformar &gt; Colocar Cada Palavra em Maiúscula</strong>.', 'Na aba <strong>Página Inicial</strong>: <strong>Remover Linhas &gt; Remover Linhas em Branco</strong> e depois <strong>Remover Linhas &gt; Remover Duplicatas</strong>.', 'Clique em <strong>Fechar e Carregar</strong>. Você deve ter 4 pessoas limpinhas na nova tabela.'],
          data: tsv(SUJO)
        }
      },
      {
        title: 'Funções dinâmicas: ÚNICO, FILTRO e CLASSIFICAR',
        say: '<p>No Microsoft 365 uma fórmula pode devolver <strong>uma lista inteira</strong>, que “derrama” nas células vizinhas. As três mais úteis:</p><ul><li><code>=ÚNICO(A2:A9)</code>: lista sem repetições.</li><li><code>=FILTRO(A2:D9; B2:B9="Sul")</code>: só as linhas que cumprem a condição.</li><li><code>=CLASSIFICAR(A2:D9; 4; -1)</code>: ordena pela coluna 4, do maior para o menor.</li></ul>',
        draw: D.pair({ cols: 2, rows: 5, w: 70, cells: { A1: 'Região', A2: 'Sul', A3: 'Norte', A4: 'Sul', A5: 'Norte' } }, { cols: 2, rows: 5, w: 70, cells: { A1: '=ÚNICO(A2:A5)', A2: 'Sul', A3: 'Norte' }, hl: ['A1:A3'], notes: [{ at: 'A3', text: 'derrama\npara baixo', side: 'right' }] }, '=ÚNICO'),
        real: {
          items: ['Copie os dados abaixo e cole na A1 de uma planilha nova.', 'Na célula F1 digite <code>=ÚNICO(B2:B9)</code> e Enter. Aparecem as regiões, sem repetição, “derramando” para baixo.', 'Na célula H1 digite <code>=FILTRO(A2:D9;B2:B9="Sul")</code>. Você deve ver só as 4 vendas do Sul.', 'Na célula M1 digite <code>=CLASSIFICAR(A2:D9;4;-1)</code>. A tabela inteira aparece ordenada pelo Valor, do maior para o menor.'],
          data: tsv([['Vendedor', 'Região', 'Produto', 'Valor']].concat(PIV_ROWS))
        }
      },
      {
        title: 'Painel (dashboard) com segmentação',
        say: '<p>Um <strong>dashboard</strong> junta resumo + gráfico + filtros clicáveis. Com a tabela dinâmica que você já sabe fazer, dá para montar um em 2 minutos.</p>',
        draw: D.flow([{ t: 'Tabela\ndinâmica', cls: 'g' }, { t: 'Gráfico\ndinâmico', cls: 'o' }, { t: 'Segmentação\n(botões de filtro)', cls: 'ok' }], { bw: 150, gap: 48, h: 110 }),
        real: {
          items: ['Use os mesmos dados da aula de tabela dinâmica (botão “Copiar dados”) e crie uma tabela dinâmica com Vendedor em Linhas e Valor em Valores.', 'Clique dentro da tabela dinâmica &gt; <strong>Inserir &gt; Gráfico Dinâmico</strong> &gt; Colunas.', 'Com a tabela dinâmica selecionada: <strong>Inserir &gt; Segmentação de Dados</strong> &gt; marque <strong>Região</strong> &gt; OK.', 'Clique nos botões da segmentação (Sul, Norte) e veja o gráfico mudar na hora. Esse é o seu dashboard!'],
          data: tsv([['Vendedor', 'Região', 'Produto', 'Valor']].concat(PIV_ROWS))
        }
      },
      {
        title: 'Sua primeira macro',
        say: '<p>Uma <strong>macro</strong> grava o que você faz e repete com um clique ou atalho. É a porta de entrada para automação (e depois para VBA, a linguagem por trás).</p>',
        draw: D.flow([{ t: 'Gravar\nmacro', cls: 'o' }, { t: 'Faça as ações\numa vez', cls: 'g' }, { t: 'Parar e\nrepetir sempre', cls: 'ok' }], { bw: 140, gap: 48, h: 110 }),
        real: {
          items: ['Se não vir a aba <strong>Desenvolvedor</strong>: Arquivo &gt; Opções &gt; Personalizar Faixa de Opções &gt; marque Desenvolvedor.', 'Digite qualquer título em A1:C1 e vá em <strong>Exibir &gt; Macros &gt; Gravar Macro</strong>. Nome: <code>FormatarCabecalho</code>, atalho Ctrl+Shift+F, OK.', 'Selecione A1:C1, aplique negrito e uma cor de preenchimento. Depois <strong>Exibir &gt; Macros &gt; Parar Gravação</strong>.', 'Apague a formatação, escreva títulos em outra linha, selecione-os e aperte Ctrl+Shift+F. A macro refaz tudo sozinha. (Salve como .xlsm para guardar a macro.)'],
          data: ''
        }
      }
    ]
  });

  const EQ = T([['Vendedor', 'Vendas', 'Meta', 'Resultado', 'Bônus', 'Região'], ['Ana', 5200, 5000, '', '', 'Sul'], ['Bruno', 3800, 4500, '', '', 'Norte'], ['Carla', 6100, 5500, '', '', 'Sul'], ['Diego', 4900, 4500, '', '', 'Norte'], ['Elisa', 2700, 3000, '', '', 'Sul']]);
  const RES = { D2: 'Bateu', D3: 'Não bateu', D4: 'Bateu', D5: 'Bateu', D6: 'Não bateu' };
  const RESF = { D2: '=SE(B2>=C2;"Bateu";"Não bateu")', D3: '=SE(B3>=C3;"Bateu";"Não bateu")', D4: '=SE(B4>=C4;"Bateu";"Não bateu")', D5: '=SE(B5>=C5;"Bateu";"Não bateu")', D6: '=SE(B6>=C6;"Bateu";"Não bateu")' };
  const PW = [80, 70, 70, 90, 74, 70];
  LESSONS.push({
    id: 'projeto', trail: 't6', title: 'Projeto: controle de vendas', time: '15 min',
    intro: 'Projeto final: usar tudo o que aprendeu numa planilha real de um time de vendas.',
    steps: [
      {
        title: 'Quem bateu a meta?',
        say: '<p>Cada vendedor tem uma <strong>meta</strong>. Na coluna Resultado, mostre <strong>“Bateu”</strong> se as vendas ≥ meta, ou <strong>“Não bateu”</strong>.</p>',
        draw: D.grid({ cols: 4, rows: 2, w: 100, cells: { A1: 'Vendedor', B1: 'Vendas', C1: 'Meta', D1: 'Resultado', A2: 'Ana', B2: '5200', C2: '5000', D2: '=SE(B2>=C2;…)' }, hl: ['D2'], hl2: ['B2', 'C2'] }),
        sheet: { cols: 6, rows: 12, data: EQ, tools: ['fill', 'bold', 'money', 'chartCol'], sel: 'D2', colW: PW }, hl: ['D2:D6'],
        task: 'Em <strong>D2</strong> use <code>=SE(B2&gt;=C2;"Bateu";"Não bateu")</code> e preencha até <strong>D6</strong>.',
        hint: 'Escreva a fórmula em D2; selecione D2:D6 e clique em ⬇ Preencher.',
        check: (c) => uses(c.raw('D2'), 'SE(', 'B2', 'C2') && Object.keys(RES).every((k) => c.v(k) === RES[k]),
        solve: (v) => { v.setCell('D2', RESF.D2); v.selectRange('D2:D6'); v.fillDown('D2:D6'); },
        win: 'Ana, Carla e Diego bateram a meta; Bruno e Elisa, não.'
      },
      {
        title: 'Calculando o bônus',
        say: '<p>Quem bateu a meta ganha <strong>5% das vendas</strong> de bônus; os outros, zero. Dá para usar <code>5%</code> direto na fórmula.</p>',
        draw: D.flow([{ t: 'Bateu a meta?\n(D2 = "Bateu")', cls: 'g' }, { t: 'SIM:\nB2 * 5%', cls: 'ok' }, { t: 'NÃO:\n0', cls: 'no' }], { bw: 150, gap: 46, h: 110 }),
        sheet: { cols: 6, rows: 12, data: Object.assign({}, EQ, RESF), tools: ['fill', 'bold', 'money', 'chartCol'], sel: 'E2', colW: PW }, hl: ['E2:E6'],
        task: 'Em <strong>E2</strong> escreva <code>=SE(D2="Bateu";B2*5%;0)</code> e preencha até <strong>E6</strong>.',
        hint: 'Texto dentro da fórmula vai entre aspas: D2="Bateu". Depois: ⬇ Preencher em E2:E6.',
        check: (c) => uses(c.raw('E2'), 'SE(', 'D2') && c.v('E2') === 260 && c.v('E3') === 0 && c.v('E4') === 305 && c.v('E5') === 245 && c.v('E6') === 0,
        solve: (v) => { v.setCell('E2', '=SE(D2="Bateu";B2*5%;0)'); v.selectRange('E2:E6'); v.fillDown('E2:E6'); },
        win: 'Bônus calculado: Ana 260, Carla 305, Diego 245.'
      },
      {
        title: 'Totais do time',
        say: '<p>O gerente quer duas respostas: <strong>total vendido</strong> e <strong>quantos bateram a meta</strong>.</p>',
        draw: D.grid({ cols: 3, rows: 2, w: 150, cells: { A1: 'Total vendido', B1: '=SOMA(B2:B6)', A2: 'Bateram a meta', B2: '=CONT.SE(D2:D6;"Bateu")' }, hl: ['B1:B2'] }),
        sheet: { cols: 6, rows: 12, data: Object.assign({}, EQ, RES, { A8: 'Total vendido', A9: 'Bateram a meta' }), colW: [100, 70, 70, 90, 74, 70], sel: 'B8' }, hl: ['B8:B9'],
        task: 'Em <strong>B8</strong> some as vendas (<code>=SOMA(B2:B6)</code>) e em <strong>B9</strong> conte quantos “Bateu” existem (<code>=CONT.SE(D2:D6;"Bateu")</code>).',
        hint: 'B8: =SOMA(B2:B6)  •  B9: =CONT.SE(D2:D6;"Bateu")',
        check: (c) => uses(c.raw('B8'), 'SOMA') && c.v('B8') === 22700 && uses(c.raw('B9'), 'CONT.SE') && c.v('B9') === 3,
        solve: (v) => { v.setCell('B8', '=SOMA(B2:B6)'); v.setCell('B9', '=CONT.SE(D2:D6;"Bateu")'); },
        win: 'R$ 22.700 vendidos e 3 de 5 bateram a meta.'
      },
      {
        title: 'Total por região',
        say: '<p>Agora, quanto cada região vendeu? Perfeito para o <strong>SOMASE</strong>.</p>',
        draw: D.grid({ cols: 3, rows: 2, w: 190, cells: { A1: 'Sul', B1: '=SOMASE(F2:F6;"Sul";B2:B6)' }, hl: ['B1'] }),
        sheet: { cols: 6, rows: 12, data: Object.assign({}, EQ, { A8: 'Total Sul', A9: 'Total Norte' }), colW: [100, 70, 70, 90, 74, 70], sel: 'B8' }, hl: ['B8:B9'],
        task: 'Em <strong>B8</strong> some as vendas da região <strong>Sul</strong> e em <strong>B9</strong> as da <strong>Norte</strong>, usando SOMASE (a região está na coluna F).',
        hint: 'B8: =SOMASE(F2:F6;"Sul";B2:B6)  •  B9: troque "Sul" por "Norte".',
        check: (c) => uses(c.raw('B8'), 'SOMASE', 'F2:F6', 'B2:B6') && c.v('B8') === 14000 && uses(c.raw('B9'), 'SOMASE') && c.v('B9') === 8700,
        solve: (v) => { v.setCell('B8', '=SOMASE(F2:F6;"Sul";B2:B6)'); v.setCell('B9', '=SOMASE(F2:F6;"Norte";B2:B6)'); },
        win: 'Sul: R$ 14.000. Norte: R$ 8.700.'
      },
      {
        title: 'Acabamento: moeda e gráfico',
        say: '<p>Para apresentar, formate o bônus como <strong>moeda</strong> e crie um <strong>gráfico de colunas</strong> comparando Vendas e Meta de cada pessoa.</p>',
        draw: D.pair({ cols: 2, rows: 3, cells: { A1: 'Bônus', A2: '260', A3: '0' } }, { cols: 2, rows: 3, w: 90, cells: { A1: 'Bônus', A2: 'R$ 260,00', A3: 'R$ 0,00' }, bold: ['A1'] }, 'R$'),
        sheet: { cols: 6, rows: 12, data: Object.assign({}, EQ, RES, { E2: 260, E3: 0, E4: 305, E5: 245, E6: 0 }), tools: ['bold', 'money', 'chartCol', 'chartLine', 'chartPie'], colW: PW, sel: 'E2' }, hl: ['E2:E6'],
        task: '1) Selecione <strong>E2:E6</strong> e clique em <strong>R$</strong>.  2) Selecione <strong>A1:C6</strong> (vendedor, vendas e meta) e crie um gráfico de <strong>📊 Colunas</strong>.',
        hint: 'Primeiro E2:E6 → R$. Depois arraste A1:C6 e clique em 📊 Colunas. O cabeçalho dá nome às colunas do gráfico.',
        check: (c) => ['E2', 'E3', 'E4', 'E5', 'E6'].every((a) => c.fmt(a).num === 'money') && c.chart && c.chart.type === 'col' && c.chart.range === 'A1:C6',
        solve: (v) => { v.selectRange('E2:E6'); v.format('E2:E6', 'money'); v.selectRange('A1:C6'); v.makeChart('col', 'A1:C6'); },
        win: '🎉 Projeto concluído! Você foi do zero a funções, buscas, tabelas dinâmicas e dashboards.'
      }
    ]
  });

  window.COURSE = { TRAILS, LESSONS, H: { T, uses, works, tsv, isF, norm, sameText } };
})();
