import { z } from "zod";

export const accountDraftKey = "paroquial.signup.account.v1";
export const parishDraftKey = (registrationId: string) => `paroquial.signup.parish.v1.${registrationId}`;
const accountSchema = z.object({ name: z.string().max(160), email: z.string().max(254), step: z.number().int().min(0).max(3) });
const parishSchema = z.object({
  values: z.object({ name: z.string().max(160), city: z.string().max(160), state: z.string().max(2), slug: z.string().max(64) }),
  step: z.number().int().min(0).max(3),
  slugEdited: z.boolean(),
});
const ttl = 24 * 60 * 60 * 1000;

function read<T>(key: string, schema: z.ZodType<T>): T | null {
  try {
    const stored = JSON.parse(sessionStorage.getItem(key) ?? "null");
    const envelope = z.object({ expiresAt: z.number(), value: schema }).safeParse(stored);
    return envelope.success && envelope.data.expiresAt > Date.now() ? envelope.data.value : null;
  } catch { return null; }
}
function write<T>(key: string, schema: z.ZodType<T>, value: T) {
  try { sessionStorage.setItem(key, JSON.stringify({ expiresAt: Date.now() + ttl, value: schema.parse(value) })); }
  catch { /* The form remains usable when storage is unavailable. */ }
}
export const readAccountDraft = () => read(accountDraftKey, accountSchema);
export const saveAccountDraft = (value: z.infer<typeof accountSchema>) => write(accountDraftKey, accountSchema, value);
export const readParishDraft = (id: string) => read(parishDraftKey(id), parishSchema);
export const saveParishDraft = (id: string, value: z.infer<typeof parishSchema>) => write(parishDraftKey(id), parishSchema, value);
export function clearSignupDraft(key: string) {
  try { sessionStorage.removeItem(key); } catch { /* Storage may be unavailable. */ }
}

// The resend cooldown is kept in storage so a refetch-driven remount cannot restart it, letting someone
// bypass the wait by triggering a revalidation. Reads clamp to a sane ceiling and ignore stale values.
const resendUntilKey = "paroquial.signup.resend-until.v1";
const maxCooldown = 120;
export function readResendCooldown(): number {
  try {
    const until = Number(JSON.parse(sessionStorage.getItem(resendUntilKey) ?? "null"));
    if (!Number.isFinite(until)) return 0;
    return Math.max(0, Math.min(maxCooldown, Math.ceil((until - Date.now()) / 1000)));
  } catch { return 0; }
}
export function startResendCooldown(seconds: number) {
  try { sessionStorage.setItem(resendUntilKey, JSON.stringify(Date.now() + seconds * 1000)); }
  catch { /* Storage may be unavailable; the in-memory countdown still runs. */ }
}
