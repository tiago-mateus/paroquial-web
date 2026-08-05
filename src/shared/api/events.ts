import { apiFetch } from "./http";

export type RepeatOption = "none" | "weekly" | "monthly";
export type EventType = "missa" | "novena" | "reuniao" | "encontro" | "adoracao" | "movimento" | "outro";

export type CalendarEvent = {
  id: string;
  sourceId: string;
  occurrenceId: string;
  tenantSlug: string;
  title: string;
  description?: string;
  location?: string;
  start: string;
  end?: string;
  type: EventType;
  repeat: RepeatOption;
  repeatUntil?: string;
  repeatWeekdays: number[];
  repeatMonthDay?: number;
};

export type CreateEventRequest = {
  title: string;
  description?: string;
  location?: string;
  start: string;
  end?: string;
  type?: EventType;
  repeat?: RepeatOption;
  repeatUntil?: string;
  repeatWeekdays?: number[];
  repeatMonthDay?: number;
};

export function getTenantEvents(tenantSlug: string, start: string, end: string) {
  return apiFetch<CalendarEvent[]>(`/api/v1/tenants/${tenantSlug}/events?start=${start}&end=${end}`);
}

export function getAdminTenantEvents(tenantSlug: string, start: string, end: string) {
  return apiFetch<CalendarEvent[]>(`/api/v1/admin/tenants/${tenantSlug}/events?start=${start}&end=${end}`);
}

export function createEvent(tenantSlug: string, input: CreateEventRequest) {
  return apiFetch<CalendarEvent>(`/api/v1/admin/tenants/${tenantSlug}/events`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateEvent(tenantSlug: string, eventId: string, input: CreateEventRequest) {
  return apiFetch<CalendarEvent>(`/api/v1/admin/tenants/${tenantSlug}/events/${eventId}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

export function deleteEvent(tenantSlug: string, eventId: string) {
  return apiFetch<void>(`/api/v1/admin/tenants/${tenantSlug}/events/${eventId}`, {
    method: "DELETE",
  });
}
