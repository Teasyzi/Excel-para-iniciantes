# Excel do Zero

Site para aprender Excel **fazendo**: um passo por vez, com desenho, explicação curta e uma missão prática numa planilha simulada (com fórmulas em português: `SOMA`, `SE`, `PROCV`, `PROCX`…).

Feito sob medida para: começar do zero, usar no **trabalho** e em **análise de dados**, com **Microsoft 365** no PC.

## O que tem

13 aulas, 51 passos, em 6 trilhas:

1. **Primeiros passos**: planilha, primeiras contas, formatação
2. **Fórmulas essenciais**: média/máximo/mínimo, `$` (referência fixa), texto
3. **Decisões e critérios**: `SE`, `E`/`OU`, `CONT.SE`, `SOMASE`
4. **Procurar informação**: `PROCV`, `PROCX`, `SEERRO`
5. **Análise de dados**: organizar, ordenar, gráficos, tabela dinâmica
6. **Avançado e projeto**: Power Query, `ÚNICO`/`FILTRO`/`CLASSIFICAR`, dashboard, macros e um projeto final

Os passos de Power Query, funções dinâmicas, dashboard e macros são feitos no Excel real do usuário (o site entrega os dados para copiar e uma lista para marcar).

## Como usar

É um site estático, sem build nem dependências. Abra o `index.html` no navegador, ou publique a pasta (por exemplo, GitHub Pages). O progresso fica salvo no `localStorage` do navegador.

## Estrutura

- `js/engine.js`: motor de planilha (parser e avaliador de fórmulas em português)
- `js/sheetview.js`: grade interativa, barra de fórmulas, ferramentas e gráficos
- `js/draw.js`: desenhos SVG das aulas
- `js/lessons.js`: todo o conteúdo (trilhas, aulas, passos, verificações)
- `js/app.js`: navegação, progresso, quiz, tabela dinâmica e passos "no seu Excel"
- `css/style.css`: estilos (claro e escuro)

Para adicionar um passo, inclua um objeto em `steps` de uma aula em `js/lessons.js` com `title`, `say`, `draw`, `sheet`, `task`, `check` e `solve`.
