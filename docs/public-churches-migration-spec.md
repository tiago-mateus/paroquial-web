# Migração — página pública de Igrejas e Capelas

## Objetivo

Migrar para `paroquial-web` a rota pública `/:tenantSlug/igrejas`. A experiência é um **localizador de igrejas e capelas**: o mapa ocupa a tela e um painel permite descobrir, filtrar, selecionar e abrir a rota de cada local.

Esta especificação descreve o comportamento e o visual que devem ser preservados ou melhorados. Ela não autoriza nem exige mudanças no backend nesta fase.

## Referência atual

A implementação de referência está no repositório legado/Next:

- rota: `ComParoquial/src/app/[paroquia]/(public)/igrejas/page.tsx`;
- experiência cliente: `ComParoquial/src/components/public/churches/`;
- implementação mais antiga, útil como histórico: `ComParoquial/src/_legacy_pages/Igrejas/`.

## Rota e acesso

| Item | Regra |
| --- | --- |
| Rota | `/:tenantSlug/igrejas` |
| Navegação | Item **Igrejas** na barra inferior mobile e no menu público desktop |
| Tenant inexistente | Exibir a página global de paróquia não encontrada/404 |
| Plano sem acesso | Exibir estado bloqueado; o recurso é exclusivo do plano `premium` no sistema atual |
| Lista vazia | Exibir estado vazio, sem tentar renderizar um mapa sem pontos |
| Dados inválidos | Igrejas sem latitude/longitude válidas continuam pesquisáveis na lista, mas não recebem marcador nem podem ser usadas como foco do mapa |

## Dados necessários

O contrato público recomendado é uma lista de igrejas do tenant:

```ts
export type PublicChurch = {
  id: string;
  tenantId: string;
  nome: string;
  endereco: string;
  latitude: number;
  longitude: number;
  urlImg: string;
  telefone: string | null;
  tipo: "matriz" | "capela" | string;
};
```

Endpoint alvo previsto:

```txt
GET /api/v1/tenants/{tenantSlug}/churches
```

Enquanto a API não estiver pronta, criar `shared/api/churches.ts` e handlers MSW equivalentes. Os mocks devem cobrir pelo menos:

- tenant premium com matriz e capelas, incluindo imagem e telefones variados;
- tenant premium sem igrejas;
- tenant não premium (bloqueado);
- uma igreja sem coordenadas;
- falha HTTP e retry.

### Regras de normalização

- Coordenadas só são válidas se latitude e longitude forem números finitos e diferentes de `0`.
- `tipo === "matriz"` recebe a apresentação de matriz; todos os outros valores são tratados visualmente como capela.
- Endereço vazio deve exibir `Endereço a confirmar`.
- Imagem vazia deve exibir ícone de igreja, nunca imagem quebrada.
- A lista deve ser ordenada alfabeticamente pelo backend ou normalizada no cliente de forma estável.

## Estrutura visual

### Base comum

- Fundo principal: mapa em tela cheia; não usar página de cards convencional.
- O mapa permanece visível enquanto o usuário consulta o painel.
- Há um contador flutuante no topo esquerdo: ícone de igreja + `N igreja(s) cadastrada(s)`.
- O contador tem superfície branca translúcida, borda branca suave, sombra discreta e `backdrop-blur`.
- O mapa usa estilo claro como padrão, com alternativas de ruas e satélite.
- O conteúdo deve respeitar `safe-area-inset-top` e `safe-area-inset-bottom`.
- A navegação pública inferior permanece acessível no mobile; o painel não pode cobri-la.

### Desktop (a partir de 768 px)

Composição:

```txt
┌──────────────────────────────── mapa ───────────────────────────────┐
│ [ contador ]                                      [camadas do mapa]  │
│                                                                       │
│                                      ┌──── painel de igrejas ─────┐  │
│                                      │ local selecionado           │  │
│                                      │ busca e filtros             │  │
│                                      │ lista rolável               │  │
│                                      └─────────────────────────────┘  │
└───────────────────────────────────────────────────────────────────────┘
```

- Painel fixo à direita, afastado `16 px` das bordas, largura aproximada de `320 px`.
- Painel branco, canto de `32 px`, borda clara e sombra grande/leve.
- O resumo do local selecionado fica no topo; busca e lista ocupam o restante da altura.
- A lista rola internamente; o mapa e a moldura do painel não devem rolar.
- Ao selecionar item ou marcador, o mapa executa `flyTo` para zoom aproximado de `15`.

### Mobile (abaixo de 768 px)

Composição:

```txt
┌──────────────────────── mapa ────────────────────────┐
│ [ contador ]                                          │
│                                                        │
│                                                        │
│  ┌──── cartão do local selecionado ────────────────┐  │
│  │ foto/ícone · nome · tipo · endereço             │  │
│  │ [ Ver igrejas ] [ Como chegar ]                  │  │
│  └─────────────────────────────────────────────────┘  │
├──────────────────── navegação pública ─────────────────┤
└─────────────────────────────────────────────────────────┘
```

- O cartão inferior fica acima da navegação, com margem lateral de `12 px` e canto de cerca de `28 px`.
- Ele mostra a igreja ativa e duas ações:
  - **Ver igrejas** abre a lista em tela cheia;
  - **Como chegar** abre Google Maps em nova aba quando há coordenadas ou ao menos nome/endereço.
- Se não for possível construir uma rota, a segunda ação vira **Buscar** e abre a lista.
- A lista mobile é um overlay de tela inteira, com fundo claro, cabeçalho fixo, botão de voltar e contador.
- Ao abrir o overlay: travar rolagem do `body`, focar o campo de busca e permitir fechar pelo botão de voltar. Se houver modal/backdrop, fechar por `Escape` também.
- Ao selecionar um resultado: fechar a lista, atualizar o cartão e centralizar o mapa no local.

## Componentes recomendados no React/Vite

```txt
features/churches/
  PublicChurchesPage.tsx          # estado de seleção e composição responsiva
  ChurchesMap.tsx                 # wrapper do mapa, carregado somente no cliente
  ChurchesMapInner.tsx            # Leaflet/react-leaflet
  ChurchSummary.tsx               # cartão do local ativo
  ChurchSearchList.tsx            # busca, filtros e lista
  ChurchListItem.tsx
  ChurchesMobileSheet.tsx         # lista em tela cheia no mobile
  ChurchesStates.tsx              # loading, erro, vazio e bloqueado
shared/api/churches.ts
mocks/data/churches.ts
mocks/handlers/churches.ts
```

É aceitável usar `react-leaflet` e Leaflet novamente. O mapa deve ser importado dinamicamente ou protegido para não exigir APIs do navegador durante SSR/testes. Como o `paroquial-web` é Vite SPA, ainda é importante não inicializar o mapa em testes jsdom.

## Interações obrigatórias

### Mapa

- Renderizar somente marcadores com coordenadas válidas.
- Ícones:
  - capela: cinza/ardósia, aproximadamente `30 px`;
  - matriz: âmbar, aproximadamente `35 px`;
  - selecionada: âmbar mais destacado, aproximadamente `40 px`, com `z-index` superior.
- Clique no marcador seleciona a igreja e atualiza painel/cartão.
- No primeiro carregamento:
  - com vários pontos: enquadrar todos (`fitBounds`);
  - com um ponto: centralizar nele em zoom próximo de `10`;
  - aplicar padding para não esconder marcadores atrás do painel.
- Camadas disponíveis: mapa claro (padrão), ruas e satélite.
- Scroll wheel habilitado no desktop; no mobile, manter o gesto de pan/zoom nativo do mapa sem impedir o uso do painel.

### Busca e filtros

- Busca por nome e endereço, sem diferenciar maiúsculas/minúsculas.
- Placeholder: `Buscar igreja ou endereço`.
- Mostrar botão para limpar somente quando há texto.
- Filtros aparecem apenas quando há matriz e capelas:
  - `Todas`;
  - `Matriz`;
  - `Capelas`.
- Exibir `X de Y igrejas` após a lista filtrada.
- Sem resultados: `Nenhuma igreja encontrada.` e orientação para tentar outro nome, endereço ou filtro.

### Lista e resumo

Cada item contém:

- miniatura `44 × 44 px` arredondada ou ícone substituto;
- nome;
- badge `Matriz` ou `Capela`;
- endereço com ícone de mapa;
- estado selecionado em fundo âmbar claro, borda âmbar e sombra leve.

O resumo do local ativo contém a mesma informação em destaque. Não há, na tela pública atual, detalhe completo, galeria, horário de missas nem ligação por telefone; estes não devem ser inventados nesta migração sem decisão de produto. O telefone permanece no contrato por compatibilidade e pode ser aproveitado posteriormente.

### Abrir rota

Gerar link externo:

```txt
https://www.google.com/maps/search/?api=1&query={latitude},{longitude}
```

Quando não houver coordenadas, usar `nome + endereco` como consulta. Abrir em nova aba com `rel="noreferrer"` ou `noopener noreferrer`.

## Estados de página

### Carregamento

- Placeholder de mapa em tons de ardósia, com gradiente/skeleton.
- Skeleton do contador e do cartão mobile ou painel desktop.
- Não mostrar layout vazio enquanto os dados ainda carregam.

### Erro

- Card centralizado com ícone de alerta.
- Título: `Erro ao carregar igrejas`.
- Texto: `Verifique sua conexão e tente novamente.`
- Botão `Tentar novamente`, com ícone de recarregar e chamada de refetch.

### Sem igrejas

- Card centralizado com ícone `MapPinOff`.
- Título: `Nenhuma igreja cadastrada`.
- Texto indicando que igrejas e capelas aparecerão quando forem cadastradas.
- Badge informativo `Aguardando dados da paróquia`.

### Recurso bloqueado

- Card centralizado com ícone de cadeado.
- Label: `Recurso premium`.
- Título: `Mapa de igrejas indisponível`.
- Texto com o nome da paróquia e explicação de que o mapa não foi ativado.
- Ações: `Início` e `Links`.

## Design tokens e acessibilidade

- Paleta predominante: `slate` para superfícies e texto; `amber` para matriz, seleção e destaque.
- Painéis: branco/translúcido, bordas `slate-100/200`, sombras suaves; evitar competir com o mapa.
- Cantos: cartões e painéis entre `16 px` e `32 px`; ações principais com altura mínima de `44 px`.
- Tipografia: nome do local em `14 px` semibold; endereço em `12 px`; badges em `10 px`, caixa alta e tracking discreto.
- Todo botão, marcador interativo e controle de busca deve ter nome acessível.
- Imagens usam o nome da igreja como `alt`; imagem decorativa inexistente usa ícone, não `alt` vazio.
- Foco visível em busca, filtros, itens, ações e botão de fechar.
- Não depender somente da cor para indicar a igreja selecionada: preservar borda, sombra e/ou `aria-current`.
- Validar em 360, 390, 768, 1024 e 1440 px.

## Query/cache e integração futura

Chave recomendada para TanStack Query:

```ts
["churches", tenantSlug]
```

Tempo de cache pode seguir o padrão global do frontend. Ao integrar o painel administrativo futuramente, invalidar essa chave após criar, editar ou excluir uma igreja.

O frontend não deve acessar banco, Prisma ou serviços do projeto Next. A única dependência de dados deve ser `shared/api/churches.ts`.

## Critérios de aceite

- [ ] A rota funciona para um tenant premium com 1, várias e nenhuma igreja.
- [ ] A rota bloqueada funciona para tenant sem plano premium.
- [ ] O mapa enquadra os marcadores e respeita o painel em cada breakpoint.
- [ ] Selecionar marcador e item da lista mantém mapa, resumo e estado selecionado sincronizados.
- [ ] Busca, filtros, limpeza e contador funcionam.
- [ ] Ação `Como chegar` gera link correto para Google Maps.
- [ ] O overlay mobile abre, ganha foco, fecha e não deixa a rolagem do documento travada.
- [ ] Existem estados de loading, erro, vazio e coordenadas inválidas.
- [ ] Lint, build e testes passam.
- [ ] Testes mínimos cobrem busca/filtro, seleção via lista, link de rota e os estados bloqueado/vazio/erro.

## Fora do escopo desta migração

- CRUD administrativo de igrejas;
- persistência de busca/filtros na URL;
- geolocalização do visitante e cálculo de distância;
- rotas internas/detalhe individual de igreja;
- horários de missa por igreja;
- upload real de imagens;
- integração definitiva com a API Spring Boot.
