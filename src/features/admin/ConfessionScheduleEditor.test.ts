import { describe, expect, it } from "vitest";
import { validateConfessionSchedule } from "./confessionSchedule";

describe("validateConfessionSchedule", () => {
  it("aceita uma lista vazia e horários completos", () => {
    expect(validateConfessionSchedule([])).toEqual({});
    expect(validateConfessionSchedule([{ dayLabel: "Quarta", startTime: "15:00", endTime: "17:00" }])).toEqual({});
  });

  it("exige período e horários completos", () => {
    expect(validateConfessionSchedule([{ dayLabel: "", startTime: "", endTime: "" }])[0]).toEqual({
      dayLabel: "Informe os dias ou o período.",
      startTime: "Informe o início.",
      endTime: "Informe o fim.",
    });
  });

  it("rejeita horário final anterior ou igual ao inicial", () => {
    expect(validateConfessionSchedule([{ dayLabel: "Sábado", startTime: "17:00", endTime: "16:00" }])[0].endTime).toBe("O fim deve ser posterior ao início.");
  });
});
