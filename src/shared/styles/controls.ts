/**
 * Geometria compartilhada dos controles (campos e botões).
 *
 * Escala: sm 40 px, md 44 px, lg 48 px. Raio único (rounded-xl). A regra de uso é:
 * - lg: formulários e fluxos de cadastro/acesso;
 * - md: barras de ferramentas (busca, filtros) e ações de cabeçalho;
 * - sm: controles auxiliares dentro de listas densas.
 * Controles equivalentes usam a mesma classe; o que muda é só o tamanho escolhido.
 */

const fieldBase =
  'block w-full min-w-0 rounded-xl border border-control-border bg-surface text-ink transition-colors placeholder:text-muted hover:border-muted focus-visible:border-primary focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-focus aria-invalid:border-danger aria-invalid:focus-visible:outline-danger disabled:cursor-not-allowed disabled:bg-selection/40 disabled:text-muted motion-reduce:transition-none';

export const fieldClasses = {
  sm: `${fieldBase} min-h-10 px-3 py-1.5 text-sm`,
  md: `${fieldBase} min-h-11 px-3.5 py-2 text-[15px]`,
  lg: `${fieldBase} min-h-12 px-4 py-2.5 text-base`,
} as const;

/** Campo que já tem um valor aplicado (filtro ativo): destaca a borda sem depender só da cor do texto. */
export const fieldActiveClass = 'border-primary text-primary';

const buttonBase =
  'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-colors focus-visible:outline-offset-2 motion-reduce:transition-none';

export const buttonSizes = {
  sm: 'min-h-10 px-3 text-sm',
  md: 'min-h-11 px-4 text-[15px]',
  lg: 'min-h-12 px-5 text-base',
} as const;

export const buttonVariants = {
  primary: 'bg-primary text-white hover:bg-primary-hover',
  secondary: 'border border-control-border bg-surface text-primary hover:bg-selection',
  ghost: 'text-primary hover:bg-selection',
  danger: 'bg-danger text-white hover:brightness-95',
} as const;

export const buttonClasses = {
  primary: {
    sm: `${buttonBase} ${buttonSizes.sm} ${buttonVariants.primary}`,
    md: `${buttonBase} ${buttonSizes.md} ${buttonVariants.primary}`,
    lg: `${buttonBase} ${buttonSizes.lg} ${buttonVariants.primary}`,
  },
  secondary: {
    sm: `${buttonBase} ${buttonSizes.sm} ${buttonVariants.secondary}`,
    md: `${buttonBase} ${buttonSizes.md} ${buttonVariants.secondary}`,
    lg: `${buttonBase} ${buttonSizes.lg} ${buttonVariants.secondary}`,
  },
  ghost: {
    sm: `${buttonBase} ${buttonSizes.sm} ${buttonVariants.ghost}`,
    md: `${buttonBase} ${buttonSizes.md} ${buttonVariants.ghost}`,
    lg: `${buttonBase} ${buttonSizes.lg} ${buttonVariants.ghost}`,
  },
  danger: {
    sm: `${buttonBase} ${buttonSizes.sm} ${buttonVariants.danger}`,
    md: `${buttonBase} ${buttonSizes.md} ${buttonVariants.danger}`,
    lg: `${buttonBase} ${buttonSizes.lg} ${buttonVariants.danger}`,
  },
} as const;
