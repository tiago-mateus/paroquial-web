import type { ConfessionScheduleItem } from "../../shared/api/tenants";

export type ConfessionScheduleErrors = Record<number, { dayLabel?: string; startTime?: string; endTime?: string }>;

export function validateConfessionSchedule(items: ConfessionScheduleItem[]): ConfessionScheduleErrors {
  return items.reduce<ConfessionScheduleErrors>((errors, item, index) => {
    const itemErrors: ConfessionScheduleErrors[number] = {};
    if (!item.dayLabel?.trim()) itemErrors.dayLabel = "Informe os dias ou o período.";
    if (!item.startTime) itemErrors.startTime = "Informe o início.";
    if (!item.endTime) itemErrors.endTime = "Informe o fim.";
    if (item.startTime && item.endTime && item.endTime <= item.startTime) itemErrors.endTime = "O fim deve ser posterior ao início.";
    if (Object.keys(itemErrors).length) errors[index] = itemErrors;
    return errors;
  }, {});
}
