import { delay, http, HttpResponse } from "msw";
import type { CreateEventRequest } from "../../shared/api/events";
import { events, tenantExists } from "../data";
import { createMockEvent, listEventsByRange, updateMockEvent } from "../events";
import { baseUrl, tenantNotFound, validationError } from "../utils";

export const eventHandlers = [
  http.get(`${baseUrl}/api/v1/tenants/:tenantSlug/events`, async ({ params, request }) => {
    await delay(300);
    return handleEventsList(String(params.tenantSlug), request.url);
  }),

  http.get(`${baseUrl}/api/v1/admin/tenants/:tenantSlug/events`, async ({ params, request }) => {
    await delay(300);
    return handleEventsList(String(params.tenantSlug), request.url);
  }),

  http.post(`${baseUrl}/api/v1/admin/tenants/:tenantSlug/events`, async ({ params, request }) => {
    await delay(350);
    const input = (await request.json()) as CreateEventRequest;
    const validation = validateEventInput(input);

    if (validation) {
      return validation;
    }

    const event = createMockEvent(String(params.tenantSlug), input);
    events.push(event);
    return HttpResponse.json(event, { status: 201 });
  }),

  http.put(`${baseUrl}/api/v1/admin/tenants/:tenantSlug/events/:eventId`, async ({ params, request }) => {
    await delay(350);
    const input = (await request.json()) as CreateEventRequest;
    const validation = validateEventInput(input);

    if (validation) {
      return validation;
    }

    const index = events.findIndex((event) => event.tenantSlug === params.tenantSlug && event.id === params.eventId);
    if (index === -1) {
      return HttpResponse.json({ code: "EVENT_NOT_FOUND", message: "Evento nao encontrado." }, { status: 404 });
    }

    events[index] = updateMockEvent(events[index], input);
    return HttpResponse.json(events[index]);
  }),

  http.delete(`${baseUrl}/api/v1/admin/tenants/:tenantSlug/events/:eventId`, async ({ params }) => {
    await delay(250);
    const index = events.findIndex((event) => event.tenantSlug === params.tenantSlug && event.id === params.eventId);
    if (index === -1) {
      return HttpResponse.json({ code: "EVENT_NOT_FOUND", message: "Evento nao encontrado." }, { status: 404 });
    }

    events.splice(index, 1);
    return new HttpResponse(null, { status: 204 });
  }),
];

function handleEventsList(tenantSlug: string, requestUrl: string) {
  const url = new URL(requestUrl);
  const start = url.searchParams.get("start");
  const end = url.searchParams.get("end");

  if (!start || !end) {
    return HttpResponse.json(
      validationError({
        start: start ? [] : ["Informe a data inicial."],
        end: end ? [] : ["Informe a data final."],
      }),
      { status: 422 },
    );
  }

  if (!tenantExists(tenantSlug)) {
    return HttpResponse.json(tenantNotFound(), { status: 404 });
  }

  return HttpResponse.json(listEventsByRange(events, tenantSlug, start, end));
}

function validateEventInput(input: CreateEventRequest) {
  if (!input.title?.trim() || !input.start) {
    return HttpResponse.json(
      validationError({
        ...(!input.title?.trim() && { title: ["Informe o titulo do evento."] }),
        ...(!input.start && { start: ["Informe o inicio do evento."] }),
      }),
      { status: 422 },
    );
  }

  if (input.end && new Date(input.end) <= new Date(input.start)) {
    return HttpResponse.json(validationError({ end: ["O termino deve ser posterior ao inicio."] }), { status: 422 });
  }

  return null;
}
