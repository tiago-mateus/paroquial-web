import type { CalendarEvent } from "../../shared/api/events";
import { toDateString } from "../utils";

const today = new Date();
const todayDate = toDateString(today);

function atToday(time: string) {
  return `${todayDate}T${time}:00`;
}

export const events: CalendarEvent[] = [
  {
    id: "00000000-0000-0000-0000-000000000201",
    sourceId: "00000000-0000-0000-0000-000000000201",
    occurrenceId: "00000000-0000-0000-0000-000000000201-202607120900",
    tenantSlug: "sao-jose",
    title: "Santa Missa",
    description: "Celebracao dominical",
    location: "Igreja Matriz",
    start: "2026-07-08T09:00:00",
    end: "2026-07-12T10:00:00",
    type: "missa",
    repeat: "weekly",
    repeatUntil: "2026-12-31",
    repeatWeekdays: [0],
  },
  {
    id: "00000000-0000-0000-0000-000000000202",
    sourceId: "00000000-0000-0000-0000-000000000202",
    occurrenceId: "00000000-0000-0000-0000-000000000202-202607151930",
    tenantSlug: "sao-jose",
    title: "Terço dos Homens",
    description: "Encontro semanal",
    location: "Igreja Matriz",
     start: atToday("18:00"),
    end: atToday("18:40"),
    type: "encontro",
    repeat: "none",
    repeatWeekdays: [],
  },
  {
    id: "00000000-0000-0000-0000-000000000204",
    sourceId: "00000000-0000-0000-0000-000000000204",
    occurrenceId: `00000000-0000-0000-0000-000000000204-${todayDate.replaceAll("-", "")}1800`,
    tenantSlug: "sao-jose",
    title: "Santa Missa",
    description: "Oracao comunitaria",
    location: "Igreja Matriz",
    start: atToday("19:00"),
    end: atToday("19:40"),
    type: "adoracao",
    repeat: "none",
    repeatWeekdays: [],
  },
  {
    id: "00000000-0000-0000-0000-000000000205",
    sourceId: "00000000-0000-0000-0000-000000000205",
    occurrenceId: `00000000-0000-0000-0000-000000000205-${todayDate.replaceAll("-", "")}1800`,
    tenantSlug: "sao-jose",
    title: "Santa Missa",
    description: "Oracao comunitaria",
    location: "Capela N. Sra. de Fátima, Ponta da Serra",
    start: atToday("18:00"),
    end: atToday("18:40"),
    type: "adoracao",
    repeat: "none",
    repeatWeekdays: [],
  },
  {
    id: "00000000-0000-0000-0000-000000000203",
    sourceId: "00000000-0000-0000-0000-000000000203",
    occurrenceId: "00000000-0000-0000-0000-000000000203-202607100800",
    tenantSlug: "nossa-senhora",
    title: "Atendimento da secretaria",
    location: "Secretaria paroquial",
    start: "2026-07-10T08:00:00",
    end: "2026-07-10T12:00:00",
    type: "outro",
    repeat: "none",
    repeatWeekdays: [],
  },

];
