# Referencia de produto e design

## Produto e usuarios

O Paroquial possui duas experiencias principais:

- Publica: fieis consultam agenda, igrejas, horarios, contatos e conteudos. A experiencia deve ser direta, acolhedora e facil de entender sem treinamento.
- Administrativa: secretaria e liderancas atualizam eventos e informacoes com frequencia. A experiencia deve ser compacta, previsivel e eficiente.

## Linguagem visual existente

- Tipografia: Poppins com fallback para fontes de sistema.
- Texto principal: slate muito escuro; texto secundario: slate medio.
- Destaque: amber para selecao, estado atual e enfase paroquial.
- Acao primaria: slate quase preto com texto branco.
- Superficies: branco e `stone-50`; evitar interfaces dominadas por uma unica cor.
- Icones: `lucide-react`.
- Tailwind CSS 4 via classes utilitarias.
- Raios devem ser moderados. Preferir `rounded-lg`, `rounded-xl` e no maximo `rounded-2xl` para dialogs ou paineis inferiores.

## Padroes de composicao

### Mapa de propriedade do conteudo

- Inicio publico: identidade e imagem em `Paroquia`; destaques e canais em `Conteudo`; proximos eventos em `Agenda`.
- Agenda publica: eventos e recorrencias em `Agenda`; locais sugeridos devem vir de `Igrejas`.
- Igrejas publicas: nome, tipo, imagem, endereco, telefone e coordenadas em `Igrejas`.
- Links publicos: titulo, destino, icone, ordem e visibilidade em `Conteudo > Canais oficiais`.
- Horarios recorrentes: confissoes e atendimentos em `Horarios`; celebracoes publicadas como eventos continuam pertencendo a `Agenda`.

Ao revisar uma dessas areas, conferir tambem a tela correspondente do outro lado. Mudancas de nomenclatura, prioridade ou estado devem permanecer coerentes entre publico e admin.

### Administracao mobile

- Navegacao principal fixa no rodape, respeitando `safe-area-inset-bottom`.
- Reservar espaco de rolagem suficiente para que o ultimo conteudo nao fique atras da navegacao.
- Cada tela deve ter um unico topo operacional.
- Favorecer listas, divisorias e barras de ferramentas compactas.
- Abrir calendarios mensais, filtros complexos e acoes contextuais em bottom sheets quando isso preservar o contexto principal.

### Administracao desktop

- Sidebar persistente e cabecalho de pagina.
- Conteudo com largura controlada e densidade maior que a experiencia publica.
- Acoes frequentes proximas ao titulo ou ao objeto editado.

### Experiencia publica

- Priorizar conteudo e proximos passos, sem linguagem administrativa.
- Usar imagens reais quando o local, igreja ou conteudo precisar ser reconhecido.
- Manter leitura confortavel, estados vazios claros e navegacao previsivel.

## Componentes importantes

- `src/features/admin/AdminLayout.tsx`: estrutura e navegacao administrativa.
- `src/features/admin/AdminPageHeader.tsx`: cabecalho administrativo desktop.
- `src/features/calendar/AdminCalendarPage.tsx`: orquestracao da agenda administrativa.
- `src/features/calendar/components/Agenda.tsx`: calendario semanal e mensal.
- `src/features/calendar/components/TimelineEventos.tsx`: lista compartilhada de eventos.
- `src/features/calendar/AdminEventFormDialog.tsx`: criacao e edicao de eventos.
- `src/shared/styles/index.css`: estilos globais. Verificar regras de elementos como `main`, pois podem somar padding aos layouts locais.

## Checklist visual

- Existe apenas uma acao primaria evidente?
- O topo da tela tem uma unica hierarquia?
- O conteudo principal aparece no primeiro viewport?
- A largura util esta sendo desperdicada por padding acumulado?
- Cards representam agrupamentos reais ou apenas decoracao?
- A interface funciona a 360 px sem corte horizontal?
- Barra fixa, teclado virtual ou sheet encobrem controles?
- Loading, vazio, erro e conteudo longo mantem a mesma estrutura?
- Titulos e locais longos degradam de forma controlada?
- Foco, nomes acessiveis e semantica HTML permanecem validos?
