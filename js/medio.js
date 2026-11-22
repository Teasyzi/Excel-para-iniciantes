/* Nível MÉDIO: missões sem explicação ao lado. Diz o que entregar, não como fazer. */
(function () {
  'use strict';
  const { TRAILS, LESSONS, H } = window.COURSE;
  const { T, uses, works } = H;
  const near = (v, x, tol) => typeof v === 'number' && Math.abs(v - x) <= (tol === undefined ? 0.005 : tol);
  const rows = (c, a, b) => { const o = []; for (let r = a; r <= b; r++) o.push(c + r); return o; };
  const fill = (v, rng) => { v.selectRange(rng); v.fillDown(rng); };

  TRAILS.push(
    { id: 'm1', name: 'Missões do dia a dia', emoji: '🛠️', level: 'Médio', mode: 'med' },
    { id: 'm2', name: 'Dados e decisões', emoji: '🧩', level: 'Médio', mode: 'med' },
    { id: 'm3', name: 'Análise', emoji: '📈', level: 'Médio', mode: 'med' }
  );
  const add = (l) => { l.mode = 'med'; LESSONS.push(l); };

  /* ---------- orçamento ---------- */
  const ORC = T([['Gasto', 'Valor', '% do total'], ['Aluguel', 1500], ['Mercado', 800], ['Transporte', 300], ['Lazer', 400], ['Contas', 500], ['Total']]);
  add({
    id: 'm-orcamento', trail: 'm1', title: 'Orçamento pessoal', time: '8 min', intro: '',
    steps: [
      {
        title: 'Para onde vai o dinheiro?',
        scenario: '<p>Você está organizando o orçamento da família e quer uma visão clara de <strong>quanto cada gasto pesa</strong> no mês.</p>',
        task: 'Calcule o <strong>total</strong> em <strong>B7</strong> e, em <strong>C2:C6</strong>, a <strong>participação de cada gasto</strong> no total, formatada como <strong>porcentagem</strong>. Se um valor mudar, tudo deve se atualizar.',
        hints: ['O total é uma soma. A participação é “parte ÷ todo”.', 'Ao copiar a fórmula para baixo, uma das células não pode sair do lugar.', 'Falta só o formato: o valor 0,43 deve aparecer como 43%.'],
        sheet: { cols: 4, rows: 9, data: ORC, tools: ['fill', 'bold', 'money', 'percent'], colW: [110, 90, 90, 60], sel: 'B7' },
        check: (c) => {
          if (!uses(c.raw('B7'), 'SOMA') || c.v('B7') !== 3500) return false;
          const vals = [1500, 800, 300, 400, 500].map((x) => x / 3500);
          if (!rows('C', 2, 6).every((a, i) => near(c.v(a), vals[i], 1e-9))) return false;
          if (!works(c, { B2: 3500 }, 'C2', 3500 / 5500)) return 'Os valores estão certos agora, mas a fórmula não acompanha mudanças no total. Confira o que muda quando você copia para baixo.';
          if (!rows('C', 2, 6).every((a) => c.fmt(a).num === 'percent')) return 'Os cálculos estão certos. Falta o formato de porcentagem em C2:C6.';
          return true;
        },
        solve: (v) => { v.setCell('B7', '=SOMA(B2:B6)'); v.setCell('C2', '=B2/$B$7'); fill(v, 'C2:C6'); v.format('C2:C6', 'percent'); },
        win: 'Aluguel pesa 43% do orçamento. Agora você enxerga o que mais pesa.'
      },
      {
        title: 'Saúde financeira',
        scenario: '<p>Agora o orçamento completo, com a <strong>renda</strong> do mês. A regra da casa: guardar pelo menos <strong>10% da renda</strong>.</p>',
        task: 'Em <strong>B10</strong>, calcule a <strong>sobra</strong> (renda − total de gastos). Em <strong>B11</strong>, mostre <strong>Saudável</strong> se a sobra for de pelo menos 10% da renda; caso contrário, <strong>Atenção</strong>.',
        hints: ['Não digite números: use as células que já têm a renda e o total.', 'É uma decisão com dois resultados possíveis.', 'A comparação é entre a sobra e uma parte da renda.'],
        sheet: { cols: 4, rows: 12, data: Object.assign({}, ORC, { B7: '=SOMA(B2:B6)', A9: 'Renda', B9: 4200, A10: 'Sobra', A11: 'Situação' }), colW: [110, 90, 90, 60], sel: 'B10' },
        check: (c) => uses(c.raw('B10'), 'B9', 'B7') && c.v('B10') === 700 && c.v('B11') === 'Saudável' && works(c, { B9: 3800 }, 'B11', 'Atenção') && works(c, { B9: 3800 }, 'B10', 300),
        solve: (v) => { v.setCell('B10', '=B9-B7'); v.setCell('B11', '=SE(B10>=B9*10%;"Saudável";"Atenção")'); },
        win: 'Sobra de R$ 700: saudável. Troque a renda para 3800 e veja o alerta.'
      }
    ]
  });

  /* ---------- turma ---------- */
  const TURMA = T([['Aluno', 'P1', 'P2', 'Faltas', 'Média', 'Situação', '', 'Peso P1', '40%'], ['Ana', 8, 7, 2, '', '', '', 'Peso P2', '60%'], ['Bruno', 5, 6, 10], ['Carla', 9, 10, 0], ['Diego', 4, 3, 4], ['Elisa', 6, 5, 1], ['Fábio', 7, 8, 9], ['Gabi', 3, 5, 3]]);
  const MEDIAS = { E2: '=B2*$I$1+C2*$I$2', E3: '=B3*$I$1+C3*$I$2', E4: '=B4*$I$1+C4*$I$2', E5: '=B5*$I$1+C5*$I$2', E6: '=B6*$I$1+C6*$I$2', E7: '=B7*$I$1+C7*$I$2', E8: '=B8*$I$1+C8*$I$2' };
  const SITF = (r) => `=SE(D${r}>8;"Reprovado";SE(E${r}>=6;"Aprovado";SE(E${r}>=4;"Recuperação";"Reprovado")))`;
  const SITS = {}; for (let r = 2; r <= 8; r++) SITS['F' + r] = SITF(r);
  const TW = [70, 50, 50, 60, 60, 100, 20, 90, 50];
  add({
    id: 'm-turma', trail: 'm1', title: 'Notas da turma', time: '12 min', intro: '',
    steps: [
      {
        title: 'Média ponderada',
        scenario: '<p>A escola mudou o critério: a <strong>P1 vale 40%</strong> e a <strong>P2 vale 60%</strong> da média. Os pesos já estão em <strong>I1</strong> e <strong>I2</strong>, porque o coordenador pode mudá-los no semestre que vem.</p>',
        task: 'Calcule a <strong>média ponderada</strong> de cada aluno em <strong>E2:E8</strong>. Se alguém mudar um peso, as médias devem se ajustar.',
        hints: ['Cada nota é multiplicada pelo seu peso, e depois somam-se as duas partes.', 'Os pesos ficam em células fixas: que cuidado isso exige ao copiar para baixo?'],
        sheet: { cols: 9, rows: 10, data: TURMA, tools: ['fill'], colW: TW, sel: 'E2' },
        check: (c) => [7.4, 5.6, 9.6, 3.4, 5.4, 7.6, 4.2].every((x, i) => near(c.v('E' + (i + 2)), x, 1e-9)) && works(c, { I1: '50%', I2: '50%' }, 'E2', 7.5) && works(c, { I1: '50%', I2: '50%' }, 'E8', 4),
        solve: (v) => { v.setCell('E2', MEDIAS.E2); fill(v, 'E2:E8'); },
        win: 'Carla lidera com 9,6. Mude os pesos e as médias reagem.'
      },
      {
        title: 'Aprovado, recuperação ou reprovado',
        scenario: '<p>Agora a situação final. As regras da escola:</p><ul><li>Mais de <strong>8 faltas</strong>: <strong>Reprovado</strong>, não importa a média.</li><li>Senão, média <strong>≥ 6</strong>: <strong>Aprovado</strong>.</li><li>Senão, média <strong>≥ 4</strong>: <strong>Recuperação</strong>.</li><li>Abaixo disso: <strong>Reprovado</strong>.</li></ul>',
        task: 'Preencha a coluna <strong>Situação (F2:F8)</strong> aplicando essas regras.',
        hints: ['Você precisa de mais de uma decisão encadeada.', 'A primeira pergunta a fazer é a das faltas; só depois olhe a média.', 'Uma decisão pode ficar dentro do “senão” de outra.'],
        sheet: { cols: 9, rows: 10, data: Object.assign({}, TURMA, MEDIAS), tools: ['fill'], colW: TW, sel: 'F2' },
        check: (c) => ['Aprovado', 'Reprovado', 'Aprovado', 'Reprovado', 'Recuperação', 'Reprovado', 'Recuperação'].every((x, i) => c.v('F' + (i + 2)) === x) && works(c, { D3: 0 }, 'F3', 'Recuperação') && works(c, { D4: 20 }, 'F4', 'Reprovado'),
        solve: (v) => { v.setCell('F2', SITF(2)); fill(v, 'F2:F8'); },
        win: 'Fábio tem boa média, mas 9 faltas: reprovado. As regras importam.'
      },
      {
        title: 'Resumo para a diretoria',
        scenario: '<p>A diretora quer o resumo da turma em três números, nas células ao lado do quadro.</p>',
        task: 'Preencha <strong>I4</strong> (quantos alunos <strong>Aprovados</strong>), <strong>I5</strong> (a <strong>maior média</strong>) e <strong>I6</strong> (o <strong>nome</strong> do aluno com a maior média). Se as notas mudarem, o nome também.',
        hints: ['Contar quantas vezes um texto aparece numa coluna.', 'Para o nome: primeiro ache a maior média, depois procure por ela na coluna e traga o nome da mesma linha.'],
        sheet: { cols: 9, rows: 10, data: Object.assign({}, TURMA, MEDIAS, SITS, { H4: 'Aprovados', H5: 'Maior média', H6: 'Quem?' }), colW: TW, sel: 'I4' },
        check: (c) => c.v('I4') === 2 && near(c.v('I5'), 9.6, 1e-9) && c.v('I6') === 'Carla' && works(c, { B2: 10, C2: 10 }, 'I6', 'Ana'),
        solve: (v) => { v.setCell('I4', '=CONT.SE(F2:F8;"Aprovado")'); v.setCell('I5', '=MÁXIMO(E2:E8)'); v.setCell('I6', '=PROCX(I5;E2:E8;A2:A8)'); },
        win: 'Dois aprovados, e Carla com a melhor média.'
      }
    ]
  });

  /* ---------- vendas ---------- */
  const VEND = T([['Vendedor', 'Região', 'Produto', 'Valor'], ['Ana', 'Sul', 'Caneta', 120], ['Bruno', 'Norte', 'Caderno', 340], ['Carla', 'Sul', 'Mochila', 800], ['Ana', 'Norte', 'Caderno', 210], ['Bruno', 'Sul', 'Caneta', 90], ['Carla', 'Norte', 'Mochila', 650], ['Ana', 'Sul', 'Mochila', 700], ['Diego', 'Norte', 'Caneta', 150], ['Bruno', 'Norte', 'Mochila', 900], ['Diego', 'Sul', 'Caderno', 260], ['Carla', 'Sul', 'Caneta', 110], ['Ana', 'Norte', 'Mochila', 500]]);
  const VW = [80, 70, 80, 70, 20, 110, 90, 90, 20];
  add({
    id: 'm-vendas', trail: 'm2', title: 'Relatório de vendas', time: '10 min', intro: '',
    steps: [
      {
        title: 'Ranking de vendedores',
        scenario: '<p>O gerente pediu um resumo por vendedor. A lista dos nomes já está em <strong>F2:F5</strong>. As vendas continuam chegando, então o resumo precisa <strong>acompanhar a tabela</strong>.</p>',
        task: 'Em <strong>G2:G5</strong>, calcule o <strong>total vendido</strong> por cada vendedor. Em <strong>H2:H5</strong>, a <strong>participação</strong> de cada um no total geral (formato porcentagem).',
        hints: ['Somar apenas as linhas que atendem a uma condição.', 'O total geral vem da coluna Valor inteira. Cuidado com o que “anda” ao preencher para baixo.', 'Participação = total do vendedor ÷ total geral.'],
        sheet: { cols: 9, rows: 15, data: Object.assign({}, VEND, T([['Vendedor', 'Total', '% do total'], ['Ana'], ['Bruno'], ['Carla'], ['Diego']], 6, 1)), tools: ['fill', 'percent', 'money'], colW: VW, sel: 'G2' },
        check: (c) => {
          const t = [1530, 1330, 1560, 410]; if (!t.every((x, i) => near(c.v('G' + (i + 2)), x))) return false;
          if (!works(c, { D2: 220 }, 'G2', 1630)) return 'Os totais batem, mas não acompanham mudanças na tabela de vendas.';
          if (!t.every((x, i) => near(c.v('H' + (i + 2)), x / 4830, 1e-6))) return false;
          if (!works(c, { D2: 220 }, 'H3', 1330 / 4930)) return 'A participação não acompanha a tabela. Confira de onde vem o total geral.';
          return rows('H', 2, 5).every((a) => c.fmt(a).num === 'percent') ? true : 'Falta o formato de porcentagem em H2:H5.';
        },
        solve: (v) => { v.setCell('G2', '=SOMASE($A$2:$A$13;F2;$D$2:$D$13)'); v.setCell('H2', '=G2/SOMA($D$2:$D$13)'); fill(v, 'G2:G5'); fill(v, 'H2:H5'); v.format('H2:H5', 'percent'); },
        win: 'Carla (32%) e Ana (32%) lideram, com Bruno logo atrás.'
      },
      {
        title: 'Ticket médio e vendas grandes',
        scenario: '<p>Duas perguntas rápidas do diretor comercial, para responder nas células ao lado (<strong>G8:G11</strong>).</p>',
        task: '<strong>G8</strong>: valor médio das vendas da região <strong>Sul</strong>. <strong>G9</strong>: o mesmo para o <strong>Norte</strong>. <strong>G10</strong>: quantas vendas passaram de <strong>R$ 500</strong> (acima de 500). <strong>G11</strong>: quanto essas vendas somam.',
        hints: ['Existe uma função que faz média apenas das linhas que cumprem uma condição.', 'Contar e somar com critério numérico: a comparação vai dentro de aspas.'],
        sheet: { cols: 9, rows: 15, data: Object.assign({}, VEND, { F8: 'Ticket médio Sul', F9: 'Ticket médio Norte', F10: 'Vendas > 500', F11: 'Soma das > 500' }), colW: [80, 70, 80, 70, 20, 120, 90, 90, 20], sel: 'G8' },
        check: (c) => near(c.v('G8'), 2080 / 6) && near(c.v('G9'), 2750 / 6) && c.v('G10') === 4 && c.v('G11') === 3050 && works(c, { D2: 1000 }, 'G10', 5),
        solve: (v) => { v.setCell('G8', '=MÉDIASE(B2:B13;"Sul";D2:D13)'); v.setCell('G9', '=MÉDIASE(B2:B13;"Norte";D2:D13)'); v.setCell('G10', '=CONT.SE(D2:D13;">500")'); v.setCell('G11', '=SOMASE(D2:D13;">500")'); },
        win: 'O Norte tem ticket médio maior; e 4 vendas grandes respondem por R$ 3.050.'
      }
    ]
  });

  /* ---------- pedidos ---------- */
  const CATALOGO = T([['Código', 'Produto', 'Preço'], [101, 'Caneta', 3], [102, 'Caderno', 20], [103, 'Mochila', 80], [104, 'Régua', 5], [105, 'Cola', 8]]);
  const PEDIDOS = T([['Código', 'Qtd', 'Produto', 'Subtotal'], [103, 2], [101, 10], [999, 1], [105, 3], [102, 1]], 5, 1);
  const PG = (r) => ({ ['G' + r]: `=SEERRO(PROCX(E${r};$A$2:$A$6;$B$2:$B$6);"Código inválido")`, ['H' + r]: `=SEERRO(PROCX(E${r};$A$2:$A$6;$C$2:$C$6)*F${r};0)` });
  const PEDF = Object.assign({}, ...[2, 3, 4, 5, 6].map(PG));
  const PW = [60, 70, 60, 20, 60, 40, 110, 80];
  add({
    id: 'm-pedidos', trail: 'm2', title: 'Catálogo e pedidos', time: '10 min', intro: '',
    steps: [
      {
        title: 'Montando o pedido',
        scenario: '<p>À esquerda está o <strong>catálogo</strong> de produtos; à direita, as <strong>linhas de um pedido</strong> (código e quantidade). Um cliente digitou um código que não existe.</p>',
        task: 'Para cada linha do pedido (<strong>G2:H6</strong>), mostre o <strong>nome do produto</strong> (G) e o <strong>subtotal</strong> = preço × quantidade (H). Se o código não existir, G deve mostrar <strong>Código inválido</strong> e H deve ser <strong>0</strong>.',
        hints: ['Você precisa buscar uma informação a partir de um código.', 'Quando a busca não acha, ela devolve um erro. Existe uma função para trocar erros por outro valor.', 'Ao copiar, o catálogo (a área onde se procura) não pode andar.'],
        sheet: { cols: 8, rows: 12, data: Object.assign({}, CATALOGO, PEDIDOS), tools: ['fill'], colW: PW, sel: 'G2' },
        check: (c) => ['Mochila', 'Caneta', 'Código inválido', 'Cola', 'Caderno'].every((x, i) => c.v('G' + (i + 2)) === x) && [160, 30, 0, 24, 20].every((x, i) => c.v('H' + (i + 2)) === x) && works(c, { E2: 104 }, 'G2', 'Régua') && works(c, { E2: 104 }, 'H2', 10),
        solve: (v) => { v.setCell('G2', PEDF.G2); v.setCell('H2', PEDF.H2); fill(v, 'G2:H6'); },
        win: 'Pedido montado, e o código 999 não quebra nada.'
      },
      {
        title: 'Fechando a nota',
        scenario: '<p>Fechamento do pedido. Pedidos a partir de <strong>R$ 150</strong> têm <strong>10% de desconto</strong> no total.</p>',
        task: 'Responda em <strong>H8:H10</strong> (os rótulos estão em G8:G10): <strong>H8</strong> = total do pedido; <strong>H9</strong> = quantas linhas têm código inválido; <strong>H10</strong> = total <strong>com desconto</strong>, quando a regra se aplicar.',
        hints: ['Para contar linhas inválidas, procure pelo texto exato que você mesmo definiu.', 'O desconto é uma decisão sobre o total.'],
        sheet: { cols: 8, rows: 12, data: Object.assign({}, CATALOGO, PEDIDOS, PEDF, { G8: 'Total', G9: 'Inválidos', G10: 'Total c/ desc.' }), colW: PW, sel: 'H8' },
        check: (c) => c.v('H8') === 234 && c.v('H9') === 1 && near(c.v('H10'), 210.6) && works(c, { F2: 0 }, 'H10', 74),
        solve: (v) => { v.setCell('H8', '=SOMA(H2:H6)'); v.setCell('H9', '=CONT.SE(G2:G6;"Código inválido")'); v.setCell('H10', '=SE(H8>=150;H8*0,9;H8)'); },
        win: 'Total R$ 234, com desconto R$ 210,60.'
      }
    ]
  });

  /* ---------- estoque ---------- */
  const EST = T([['Produto', 'Estoque', 'Mínimo', 'Custo', 'Status', 'Comprar'], ['Caneta', 120, 100, '1,5'], ['Caderno', 30, 50, 12], ['Mochila', 15, 10, 45], ['Régua', 8, 40, 2], ['Cola', 60, 30, '3,5'], ['Tesoura', 5, 20, 9]]);
  const ESTF = {}; for (let r = 2; r <= 7; r++) { ESTF['E' + r] = `=SE(B${r}<C${r};"Repor";"OK")`; ESTF['F' + r] = `=SE(E${r}="Repor";C${r}*2-B${r};0)`; }
  add({
    id: 'm-estoque', trail: 'm2', title: 'Controle de estoque', time: '10 min', intro: '',
    steps: [
      {
        title: 'O que precisa ser reposto?',
        scenario: '<p>Todo produto tem um <strong>estoque mínimo</strong>. O almoxarifado quer saber o que repor e <strong>quanto comprar</strong> para voltar a ter o <strong>dobro do mínimo</strong>.</p>',
        task: 'Preencha <strong>Status (E2:E7)</strong>: <strong>Repor</strong> se o estoque está abaixo do mínimo, senão <strong>OK</strong>. Em <strong>Comprar (F2:F7)</strong>: a quantidade para chegar ao dobro do mínimo, se for repor; senão <strong>0</strong>.',
        hints: ['A coluna Comprar depende do resultado da coluna Status.', 'Quantidade a comprar = (2 × mínimo) − estoque atual, mas só quando o status pedir.'],
        sheet: { cols: 6, rows: 10, data: EST, tools: ['fill'], colW: [80, 70, 70, 60, 70, 70], sel: 'E2' },
        check: (c) => ['OK', 'Repor', 'OK', 'Repor', 'OK', 'Repor'].every((x, i) => c.v('E' + (i + 2)) === x) && [0, 70, 0, 72, 0, 35].every((x, i) => c.v('F' + (i + 2)) === x) && works(c, { B2: 90 }, 'E2', 'Repor') && works(c, { B2: 90 }, 'F2', 110),
        solve: (v) => { v.setCell('E2', ESTF.E2); v.setCell('F2', ESTF.F2); fill(v, 'E2:F7'); },
        win: 'Três produtos para repor.'
      },
      {
        title: 'Quanto custa isso tudo?',
        scenario: '<p>O financeiro precisa de três números para aprovar a compra.</p>',
        task: '<strong>B9</strong>: valor total parado em estoque (estoque × custo de cada produto, somado). <strong>B10</strong>: custo total da reposição (quantidade a comprar × custo, somado). <strong>B11</strong>: quantos itens precisam de reposição.',
        hints: ['Você precisa multiplicar duas colunas e somar os resultados, sem criar uma coluna extra.', 'Existe uma função que faz exatamente “multiplica linha a linha e soma”.'],
        sheet: { cols: 6, rows: 12, data: Object.assign({}, EST, ESTF, { A9: 'Valor em estoque', A10: 'Custo da reposição', A11: 'Itens a repor' }), colW: [120, 80, 70, 60, 70, 70], sel: 'B9' },
        check: (c) => near(c.v('B9'), 1486) && near(c.v('B10'), 1299) && c.v('B11') === 3 && works(c, { B2: 90 }, 'B11', 4),
        solve: (v) => { v.setCell('B9', '=SOMARPRODUTO(B2:B7;D2:D7)'); v.setCell('B10', '=SOMARPRODUTO(F2:F7;D2:D7)'); v.setCell('B11', '=CONT.SE(E2:E7;"Repor")'); },
        win: 'R$ 1.486 em estoque e R$ 1.299 para repor.'
      }
    ]
  });

  /* ---------- contatos ---------- */
  const CONT = T([['Nome', 'Sobrenome', 'Nome completo', 'E-mail'], ['  maria ', 'SILVA'], ['JOÃO', 'pereira '], ['ana  paula', 'Costa'], [' bruno', 'LIMA ']]);
  add({
    id: 'm-contatos', trail: 'm2', title: 'Limpando contatos', time: '8 min', intro: '',
    steps: [{
      title: 'Lista bagunçada',
      scenario: '<p>Você recebeu uma lista de contatos digitada à mão: espaços sobrando, letras maiúsculas e minúsculas misturadas.</p>',
      task: 'Em <strong>C2:C5</strong>, monte o <strong>nome completo</strong> bem escrito (cada palavra com inicial maiúscula, sem espaços sobrando). Em <strong>D2:D5</strong>, crie o e-mail: <strong>primeira letra do nome + sobrenome</strong>, tudo em minúsculas, seguido de <code>@empresa.com</code> (ex.: <code>msilva@empresa.com</code>).',
      hints: ['Há uma função que remove espaços extras e outra que ajusta as iniciais.', 'Para o e-mail, você precisa pegar apenas o começo de um texto e juntar com outro.', 'Limpe primeiro, junte depois.'],
      sheet: { cols: 4, rows: 7, data: CONT, tools: ['fill'], colW: [90, 90, 130, 160], sel: 'C2' },
      check: (c) => ['Maria Silva', 'João Pereira', 'Ana Paula Costa', 'Bruno Lima'].every((x, i) => c.v('C' + (i + 2)) === x) && ['msilva', 'jpereira', 'acosta', 'blima'].every((x, i) => c.v('D' + (i + 2)) === x + '@empresa.com') && works(c, { A2: ' pedro ', B2: 'ALVES' }, 'C2', 'Pedro Alves') && works(c, { A2: ' pedro ', B2: 'ALVES' }, 'D2', 'palves@empresa.com'),
      solve: (v) => { v.setCell('C2', '=PRI.MAIÚSCULA(ARRUMAR(A2)&" "&ARRUMAR(B2))'); v.setCell('D2', '=MINÚSCULA(ESQUERDA(ARRUMAR(A2);1)&ARRUMAR(B2))&"@empresa.com"'); fill(v, 'C2:D5'); },
      win: 'Lista limpa e e-mails prontos para a campanha.'
    }]
  });

  /* ---------- gráficos e dinâmica ---------- */
  const PIVR = [['Ana', 'Sul', 'Caneta', 100], ['Bruno', 'Norte', 'Caderno', 200], ['Ana', 'Norte', 'Caderno', 150], ['Carla', 'Sul', 'Mochila', 300], ['Bruno', 'Sul', 'Caneta', 50], ['Ana', 'Sul', 'Mochila', 120], ['Carla', 'Norte', 'Caneta', 80], ['Bruno', 'Norte', 'Mochila', 250], ['Diego', 'Sul', 'Caderno', 190], ['Diego', 'Norte', 'Mochila', 410]];
  add({
    id: 'm-analise', trail: 'm3', title: 'Ranking, gráfico e dinâmica', time: '10 min', intro: '',
    steps: [
      {
        title: 'Os melhores meses',
        scenario: '<p>Para a reunião de amanhã, a diretoria quer ver <strong>apenas os 3 meses mais fortes</strong> de vendas, do melhor para o pior, num gráfico.</p>',
        task: 'Organize a tabela do <strong>melhor mês para o pior</strong> e crie um <strong>gráfico de colunas</strong> contendo <strong>somente os 3 melhores meses</strong> (com o cabeçalho).',
        hints: ['Primeiro ordene; depois escolha o que entra no gráfico.', 'Depois de ordenar, os melhores meses ficam juntos no topo.'],
        sheet: { cols: 6, rows: 8, data: T([['Mês', 'Vendas'], ['Jan', 1200], ['Fev', 1500], ['Mar', 900], ['Abr', 1800], ['Mai', 2100], ['Jun', 1700]]), table: { c1: 1, c2: 2, r1: 2, r2: 7 }, tools: ['sortAZ', 'sortZA', 'chartCol', 'chartLine', 'chartPie'], sel: 'A1' },
        check: (c) => c.v('B2') === 2100 && c.v('B3') === 1800 && c.v('B4') === 1700 && c.chart && c.chart.type === 'col' && c.chart.range === 'A1:B4',
        solve: (v) => { v.selectRange('B2'); v.sort('B', 'desc'); v.selectRange('A1:B4'); v.makeChart('col', 'A1:B4'); },
        win: 'Maio, Abril e Junho: um gráfico limpo para a reunião.'
      },
      {
        title: 'Valor médio por produto',
        scenario: '<p>O gerente de produtos quer saber qual é o <strong>valor médio de venda</strong> de cada produto. Use a tabela abaixo.</p>',
        task: 'Monte o resumo que mostra, para cada <strong>Produto</strong>, a <strong>média</strong> do <strong>Valor</strong>.',
        hints: ['Escolha qual campo vira linha e qual vira número.', 'A operação padrão é soma; troque-a pela que a pergunta pede.'],
        pivot: { fields: [{ name: 'Vendedor', type: 'text' }, { name: 'Região', type: 'text' }, { name: 'Produto', type: 'text' }, { name: 'Valor', type: 'num' }], rows: PIVR },
        check: (c) => c.pivot && c.pivot.row === 'Produto' && c.pivot.val === 'Valor' && c.pivot.op === 'MEDIA',
        solve: (w) => w.set({ row: 'Produto', val: 'Valor', op: 'MEDIA' }),
        win: 'Mochila tem o maior valor médio por venda.'
      }
    ]
  });
})();
