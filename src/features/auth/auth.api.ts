import { z } from 'zod';
import { apiFetch } from '../../shared/api/http';

import { launchMode } from "../../shared/launchMode";

const launchSessionPath = "/api/launch-session";
const sessionSchema = z.object({
  user: z.object({ id: z.string(), name: z.string(), email: z.string() }),
  adminTenants: z.array(z.object({ id: z.string(), slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/), name: z.string(), role: z.string() })),
  onboardingRequired: z.boolean().optional(),
});

export type LoginSession = z.infer<typeof sessionSchema>;
export const getSession = () => apiFetch<unknown>(launchMode ? launchSessionPath : '/api/v1/auth/me').then(sessionSchema.parse);

export async function login(email: string, password: string): Promise<LoginSession> {
  const response = await apiFetch<unknown>(launchMode ? launchSessionPath : '/api/v1/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  return sessionSchema.parse(response);
}

export const logoutLaunch = () => apiFetch<void>(launchSessionPath, { method: "DELETE" });
