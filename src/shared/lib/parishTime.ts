/**
 * Hora de parede da paróquia.
 *
 * A API devolve início e término dos eventos como data e hora locais da paróquia, sem deslocamento
 * (ex.: "2026-11-17T18:00:00"). Comparar isso com `new Date()` mistura o fuso do navegador com o da
 * paróquia. Aqui tudo vira "milissegundos de parede": um número em que os campos UTC mostram a data
 * e a hora locais da paróquia. Esse valor não depende do fuso do navegador.
 *
 * O cadastro do tenant ainda não tem fuso próprio; enquanto isso vale o fuso padrão do produto
 * (o mesmo já usado nas datas de assinatura).
 */
export const PARISH_TIME_ZONE = "America/Sao_Paulo";

const WALL_CLOCK = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?(?:\.\d+)?$/;
const HAS_OFFSET = /(?:Z|[+-]\d{2}(?::?\d{2})?)$/i;
const formatters = new Map<string, Intl.DateTimeFormat>();

/** Instante absoluto -> milissegundos de parede no fuso informado. */
export function wallClockNow(instant: Date, timeZone: string = PARISH_TIME_ZONE) {
  let formatter = formatters.get(timeZone);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat("en-US", { timeZone, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" });
    formatters.set(timeZone, formatter);
  }
  const parts = formatter.formatToParts(instant);
  const read = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((part) => part.type === type)?.value);
  return Date.UTC(read("year"), read("month") - 1, read("day"), read("hour"), read("minute"), read("second"));
}

/** Texto de data e hora da API -> milissegundos de parede. Valores com deslocamento são convertidos para o fuso da paróquia. */
export function parseWallClock(value: string | null | undefined, timeZone: string = PARISH_TIME_ZONE): number | null {
  if (!value) return null;
  const text = value.trim();
  const plain = WALL_CLOCK.exec(text);
  if (plain) return Date.UTC(+plain[1], +plain[2] - 1, +plain[3], +plain[4], +plain[5], +(plain[6] ?? 0));
  if (HAS_OFFSET.test(text)) {
    const instant = new Date(text);
    return Number.isNaN(instant.getTime()) ? null : wallClockNow(instant, timeZone);
  }
  return null;
}

/** "YYYY-MM-DD" do dia de parede. */
export const wallDateKey = (wallMs: number) => new Date(wallMs).toISOString().slice(0, 10);
/** "HH:mm" da hora de parede. */
export const wallTimeLabel = (wallMs: number) => new Date(wallMs).toISOString().slice(11, 16);

export function shiftDateKey(key: string, days: number) {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day + days)).toISOString().slice(0, 10);
}

/** Formata uma data de parede sem aplicar o fuso do navegador. */
export function formatWallDate(wallMs: number, options: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat("pt-BR", { ...options, timeZone: "UTC" }).format(new Date(wallMs));
}
