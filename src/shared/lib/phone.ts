export function getBrazilianWhatsappHref(value?: string | null) {
  const digits = phoneDigits(value);
  if (!digits || !isValidBrazilianPhone(value)) return undefined;
  const international = digits.startsWith("55") && (digits.length === 12 || digits.length === 13) ? digits : `55${digits}`;
  return `https://wa.me/${international}`;
}

export function isValidBrazilianPhone(value?: string | null) {
  const digits = phoneDigits(value);
  if (!digits) return true;
  const local = digits.startsWith("55") && (digits.length === 12 || digits.length === 13) ? digits.slice(2) : digits;
  return local.length === 10 || local.length === 11;
}

export function formatBrazilianPhone(value: string) {
  const digits = phoneDigits(value).slice(0, 13);
  const hasCountryCode = digits.startsWith("55") && digits.length > 11;
  const local = hasCountryCode ? digits.slice(2) : digits;
  const formattedLocal = formatLocalPhone(local);
  return hasCountryCode ? `+55 ${formattedLocal}` : formattedLocal;
}

function formatLocalPhone(digits: string) {
  if (digits.length <= 2) return digits ? `(${digits}` : "";
  const areaCode = digits.slice(0, 2);
  const subscriber = digits.slice(2, 11);
  const splitAt = subscriber.length > 8 ? 5 : 4;
  const first = subscriber.slice(0, splitAt);
  const last = subscriber.slice(splitAt);
  return `(${areaCode}) ${first}${last ? `-${last}` : ""}`;
}

function phoneDigits(value?: string | null) {
  return value?.replace(/\D/g, "") ?? "";
}
