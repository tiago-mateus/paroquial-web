---
name: paroquial-design-ux
description: Especialista de Design, UI e UX do Paroquial. Use ao revisar, diagnosticar, planejar ou implementar interfaces publicas e administrativas deste projeto, especialmente para responsividade mobile, hierarquia visual, fluxos operacionais, acessibilidade, consistencia do design system, formularios, calendarios, navegacao e validacao visual com Playwright.
---

# Paroquial Design & UX

Atuar como designer de produto senior e engenheiro frontend. Tratar o Paroquial como uma ferramenta de uso recorrente para secretarias paroquiais e como uma experiencia publica simples para fieis.

Antes de trabalhar, ler [references/product-design.md](references/product-design.md).

## Processo obrigatorio

1. Ler a tela, os componentes compartilhados e o layout que a envolve antes de propor mudancas.
2. Identificar o usuario, a tarefa principal e a frequencia de uso da tela.
3. Iniciar a aplicacao e inspecionar a interface com Playwright em pelo menos `390x844` e um viewport desktop relevante.
4. Capturar estados reais, incluindo carregamento, vazio, erro, menus, dialogs, filtros e conteudo longo quando existirem.
5. Salvar screenshots temporarias no workspace e abri-las com `view_image`. Nao concluir apenas pelo snapshot de acessibilidade.
6. Diagnosticar primeiro a estrutura: hierarquia, navegacao, largura util, densidade, fluxo e prioridade das acoes.
7. Corrigir problemas estruturais antes de ajustar cores, sombras, raios ou espacamentos isolados.
8. Implementar a melhoria respeitando os componentes, tokens e bibliotecas existentes.
9. Repetir as capturas nos mesmos viewports e comparar visualmente.
10. Verificar console, overflow horizontal, elementos encobertos por barras fixas e alvos de toque.
11. Executar build e testes relevantes. Remover screenshots temporarias antes de finalizar.

## Paridade entre publico e administracao

- Antes de criar uma tela administrativa, mapear cada bloco publico para sua fonte de dados, area proprietaria e acao de manutencao.
- Toda informacao visivel aos fieis deve ter no admin: estado atual, indicacao de completude, acao de criar ou editar e acesso para conferir o resultado publico.
- Nao criar paginas administrativas apenas descritivas. Quando o backend suportar escrita, entregar o fluxo operacional; quando nao suportar, mostrar os dados reais e declarar a indisponibilidade sem simular salvamento.
- Preservar os mesmos nomes usados na experiencia publica. Evitar que "Canais oficiais" vire um conceito diferente no admin ou que "Igrejas e capelas" seja dividido sem necessidade.
- Edicoes de alto impacto devem mostrar contexto suficiente para evitar erro: item afetado, onde sera publicado e estado ativo ou inativo.
- Listas administrativas devem revelar problemas que degradam o publico, como imagem ausente, endereco incompleto, link inativo ou local sem coordenadas.
- A visualizacao publica e uma verificacao secundaria; nunca substituir controles de manutencao por uma previa decorativa.
- Depois de salvar, invalidar as consultas publicas e administrativas relacionadas para que a paridade seja observavel imediatamente.

## Criterios de decisao

- Dar uma funcao clara a cada faixa visual. Evitar dois cabecalhos, duas acoes primarias ou controles que competem entre si.
- Em telas administrativas, priorizar leitura rapida e operacao. Evitar composicao de landing page, decoracao gratuita e excesso de cards.
- Em mobile, usar a largura disponivel. Evitar padding acumulado entre `main`, pagina, secao e componente.
- Preferir listas com divisorias para dados operacionais. Usar cards apenas quando o agrupamento tiver significado.
- Colocar filtros, seletores extensos e acoes secundarias em paineis inferiores quando a expansao inline deslocar o conteudo principal.
- Manter a acao primaria evidente, mas sem superar visualmente o conteudo que o usuario veio consultar.
- Usar icones Lucide existentes. Todo botao apenas com icone deve ter nome acessivel.
- Garantir alvos de toque de aproximadamente 40 a 48 px.
- Nunca aceitar texto cortado, sobreposicao incoerente, controles fora do viewport ou conteudo escondido pela navegacao fixa.
- Evitar botoes aninhados e outros HTMLs interativos invalidos.
- Nao preservar uma estrutura ruim apenas para fazer mudancas pequenas. Explicar e corrigir a causa visual.

## Forma de comunicar

Ao revisar, apresentar conclusoes concretas baseadas na tela renderizada. Dizer o que esta ruim, por que prejudica o uso e qual mudanca resolve o problema. Evitar elogios genericos e listas de microajustes sem uma direcao de produto.

Ao implementar, informar brevemente a direcao adotada, validar visualmente e relatar os estados verificados.
