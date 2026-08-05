# Migração — página pública de Links

## Objetivo

Migrar para `paroquial-web` a rota pública `/:tenantSlug/links`. A página reúne os canais oficiais de uma paróquia em cards externos: site, WhatsApp, redes sociais, e-mail, localização e outros links configurados pelo administrador.

O escopo desta fase é somente frontend. A tela deve funcionar integralmente com contratos e MSW antes de existir a API definitiva.

## Referência atual

A referência funcional e visual está no projeto atual:

- rota: `ComParoquial/src/app/[paroquia]/(public)/links/page.tsx`;
- card público: `ComParoquial/src/app/[paroquia]/(public)/links/LinkItem.tsx`;
- versão anterior: `ComParoquial/src/_legacy_pages/Links/`.

## Rota e contexto público

| Item | Regra |
| --- | --- |
| Rota | `/:tenantSlug/links` |
| Navegação | Item **Links** na barra pública inferior mobile e no menu desktop |
| Tenant | Resolver a paróquia pelo slug da URL; tenant inexistente usa o estado global de 404/paróquia não encontrada |
| Links exibidos | Apenas links ativos (`isActive === true`), ordenados pelo campo `order` crescente |
| Header | Reutilizar o header público da paróquia, configurado com a identidade visual do tenant |
| Ação superior do header | Na página de links, o atalho superior deve apontar para `/:tenantSlug` e exibir `Início` |

## Dados necessários

Contrato público recomendado:

```ts
export type PublicLink = {
  id: string;
  title: string;
  url: string;
  iconKey?: string | null;
  colorKey?: string | null;
  color?: string | null;
  variant?: "default" | "filled" | "pill" | string | null;
  order: number;
};
```

Endpoint alvo:

```txt
GET /api/v1/tenants/{tenantSlug}/links
```

O endpoint público deve devolver somente itens ativos. Mesmo assim, o frontend deve filtrar defensivamente itens marcados como inativos caso o contrato ainda esteja em transição.

Enquanto a API não existir, criar:

```txt
src/shared/api/links.ts
src/mocks/data/links.ts
src/mocks/handlers/links.ts
```

Os mocks devem cobrir:

- lista com diferentes ícones, cores e variantes;
- lista vazia;
- tenant inexistente;
- erro de carregamento;
- links com URL sem protocolo, `mailto:` e `tel:`;
- ao menos um item inativo para garantir que não é exibido.

## Estrutura de página e layout

### Estrutura

```txt
┌────────────────── header público da paróquia ──────────────────┐
│ localização · [ Início ]                                       │
│ saudação, nome da paróquia, confissões e secretaria             │
└────────────────────────────────────────────────────────────────┘
                 ┌──────── superfície de conteúdo ────────┐
                 │ Canais de Acesso                  [ N ] │
                 │ Clique em um dos cards…                 │
                 │                                          │
                 │ [ card ] [ card ]                        │
                 │ [ card ] [ card ]                        │
                 └──────────────────────────────────────────┘
                       barra pública mobile (quando aplicável)
```

- Reutilizar o mesmo hero/header visual da home, incluindo cidade, imagem/gradiente configurável, horários de confissão e contato da secretaria.
- O conteúdo sobrepõe levemente o hero em mobile; em desktop ele se alinha sem essa necessidade de sobreposição excessiva.
- Área de conteúdo centralizada, largura máxima aproximada de `768 px` (`max-w-3xl`).
- Fundo geral `slate-50`; superfície de conteúdo branca, com canto superior amplo e sombra suave no mobile.
- Padding mobile entre `16 px` e `20 px`; desktop entre `24 px` e `32 px`.
- Manter espaço inferior suficiente para a navegação pública mobile e `safe-area-inset-bottom`.

### Cabeçalho do conteúdo

- Título: `Canais de Acesso`.
- Texto auxiliar: `Clique em um dos cards abaixo para ser redirecionado.`
- Badge de contagem à direita apenas quando há links:
  - `1 link`;
  - `N links`.
- Em telas estreitas, título/texto podem ocupar duas linhas; o badge não deve esmagar o conteúdo. Se necessário, permitir quebra ou posicioná-lo abaixo.

### Grade

- Mobile: uma coluna.
- A partir de `768 px`: duas colunas.
- Espaçamento entre cards: `16 px`.
- Todos os cards devem ter altura naturalmente consistente, mas não precisam forçar o título a duas linhas.
- Não há busca, filtros, categorias ou paginação na tela atual.

## Card de link

Cada card representa um destino externo e deve ser um único alvo interativo (`<a>`), não um botão que abre uma nova aba manualmente.

### Conteúdo

- ícone à esquerda;
- título do link, com truncamento em uma linha;
- domínio limpo abaixo do título quando ele puder ser extraído;
- ícone de link externo à direita;
- indicador de carregamento breve após o clique, sem bloquear a abertura do destino.

Exemplos de domínio:

```txt
https://www.instagram.com/paroquia  → instagram.com
https://paroquia.org.br              → paroquia.org.br
mailto:secretaria@paroquia.org.br    → sem domínio obrigatório
```

### Variações visuais

| Variante | Fundo | Ícone | Texto |
| --- | --- | --- | --- |
| `default` | Branco, borda `slate-200`, sombra leve | quadrado arredondado de `44 × 44 px`, com cor do link | ardósia escuro; domínio cinza |
| `filled` | Cor do link | quadrado translúcido branco | branco; domínio branco com opacidade |
| `pill` | Branco, borda `slate-200`, canto totalmente arredondado | círculo de `32 × 32 px`, com cor do link | igual ao `default` |

Regras comuns:

- `default` e `filled`: cantos de `16 px`.
- Espaçamento interno aproximado: `16 px`.
- Hover: deslocamento vertical de até `2 px`, sombra um pouco maior e borda mais perceptível.
- Active: escala de aproximadamente `0.98`.
- Focus-visible: anel âmbar acessível.
- O card inteiro deve ter rótulo acessível `Abrir {title}`.

### Cores

Tokens atualmente reconhecidos:

| `colorKey` | Cor |
| --- | --- |
| `slate` | `#1e293b` |
| `blue` | `#2563eb` |
| `green` | `#16a34a` |
| `pink` | `#db2777` |
| `red` | `#dc2626` |
| `orange` | `#ea580c` |
| `amber` | `#d97706` |
| `indigo` | `#4f46e5` |

Prioridade de resolução: `colorKey` conhecido → `color` livre → `slate`.

### Ícones

Ícones configuráveis:

| `iconKey` | Ícone |
| --- | --- |
| `site` | Globo |
| `whatsapp` | Telefone |
| `facebook` | Facebook |
| `instagram` | Instagram |
| `youtube` | YouTube |
| `email` | E-mail |
| `map` | Marcador de mapa |
| `link` | Link externo |

Se `iconKey` não estiver presente ou for desconhecido, inferir a partir da URL nesta ordem: Instagram, Facebook, YouTube, WhatsApp, e-mail, Google Maps e, por fim, link externo.

## URL e abertura externa

Normalização obrigatória:

```txt
https://...  → preservar
http://...   → preservar
mailto:...   → preservar
tel:...      → preservar
outro valor  → prefixar com https://
```

O destino abre em nova aba:

```html
target="_blank" rel="noopener noreferrer"
```

Não permitir que uma URL inválida gere erro de renderização. Quando não for possível extrair domínio, simplesmente ocultá-lo.

## Analytics de clique

O sistema atual registra visualização da página e cliques. Na migração frontend, preservar o desenho da integração, mas não bloquear a navegação por causa dela.

Endpoint futuro recomendado:

```txt
POST /api/v1/tenants/{tenantSlug}/links/{linkId}/click
```

Payload sugerido:

```json
{
  "visitorId": "uuid-ou-anonimo",
  "referer": "https://..."
}
```

Regras:

- gerar/reutilizar `visitorId` no `localStorage` quando disponível; usar `anonymous` como fallback;
- registrar uma única tentativa por clique, evitando disparos duplicados;
- usar `keepalive: true` quando suportado;
- ignorar falhas silenciosamente: o link precisa abrir mesmo se a telemetria falhar;
- a abertura de página pode ser adicionada em etapa posterior caso haja endpoint específico; ela não é condição para lançar a UI.

## Estados

### Loading

- Manter header público visível assim que dados do tenant estiverem disponíveis.
- Exibir grade de quatro skeletons de card, em uma ou duas colunas conforme breakpoint.
- Cada skeleton deve aproximar a altura do card final e usar animação discreta.

### Erro

- Usar o componente compartilhado de erro da aplicação.
- Texto recomendado: `Não foi possível carregar os links` e `Tente novamente em instantes.`
- Disponibilizar ação `Tentar novamente` que refaz a query.

### Lista vazia

- Ícone de link externo dentro de círculo claro.
- Texto: `Nenhum link disponível no momento.`
- Espaçamento vertical generoso para não parecer uma falha de layout.

### Tenant inexistente

- Não renderizar header ou cards com dados genéricos.
- Encaminhar para o estado global de paróquia não encontrada.

## Componentes e organização recomendados

```txt
features/links/
  PublicLinksPage.tsx
  PublicLinkCard.tsx
  linkPresentation.ts        # cor, ícone, variante, domínio e normalização de URL
  linkAnalytics.ts           # tentativa não bloqueante de registro de clique
shared/api/links.ts
mocks/data/links.ts
mocks/handlers/links.ts
```

O header público, o shell de conteúdo e a navegação devem ser reutilizados; não duplicar a lógica de aparência, contato e confissões dentro da feature de links.

## Query/cache e integração futura

Chave recomendada de TanStack Query:

```ts
["links", tenantSlug]
```

Ao criar, editar, ativar/desativar ou reordenar links no futuro painel administrativo, invalidar esta chave. A ordenação pública é parte do contrato e não deve ser redefinida por ordem de resposta do navegador.

## Acessibilidade

- Link inteiro acessível por teclado e com foco visível.
- Usar `<a>`, pois a interação navega para um recurso externo.
- Ícones decorativos não devem repetir texto no leitor de tela.
- `aria-label` deve informar o destino: `Abrir {título}`.
- Respeitar preferência de redução de movimento, removendo/atenuando deslocamento e spinner animado quando necessário.
- Garantir contraste suficiente para `filled`, inclusive quando vier uma cor customizada; se a administração permitir cores livres, validar contraste ou aplicar fallback.

## Critérios de aceite

- [ ] A rota resolve o tenant e mostra somente links ativos, ordenados.
- [ ] Header público, navegação e área segura mobile correspondem às demais telas públicas.
- [ ] A grade é uma coluna no mobile e duas no desktop.
- [ ] Todas as três variantes de card funcionam e preservam conteúdo/contraste.
- [ ] Ícone, cor e domínio têm fallbacks seguros.
- [ ] URLs web, `mailto:` e `tel:` são normalizadas corretamente.
- [ ] O destino abre em nova aba com proteção `noopener`/`noreferrer`.
- [ ] Registro de clique é uma tentativa única e não bloqueia a navegação.
- [ ] Estados de loading, erro, vazio e tenant inexistente estão cobertos.
- [ ] Testes mínimos validam ordenação/filtro de ativos, variantes, normalização da URL, analytics não bloqueante e estado vazio.
- [ ] Lint, build e testes passam.

## Fora do escopo

- CRUD, ativação/desativação e reordenação administrativa;
- dashboard de métricas e contagem de cliques;
- categorias, busca e filtros públicos;
- abertura de links dentro do aplicativo;
- encurtamento, verificação ou prévia remota de URLs;
- integração definitiva com API Spring Boot.
