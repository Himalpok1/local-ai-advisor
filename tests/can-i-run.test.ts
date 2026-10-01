import { describe, expect, it } from "vitest";
import { HARDWARE, MODELS } from "@/data";
import { CHAT, CHAT_APPS_CLOSED, WORKLOADS, memoryGap, rate, smallerSiblings, usable } from "@/lib/can-i-run";
import { bestQuantFor, candidateQuants, evaluate } from "@/lib/recommendations";

const hw = (id: string) => HARDWARE.find((h) => h.id === id)!;
const model = (id: string) => MODELS.find((m) => m.id === id)!;

describe("quantization pick", () => {
  it("never picks 3-bit when a 4-bit-or-better version is usable", () => {
    for (const h of ["mba-m4-10c-32", "mba-m4-10c-16", "pc-rtx-3060-12-32"]) {
      for (const m of ["qwen3-8b", "llama-3.1-8b"]) {
        const base = { hardware: hw(h), modelId: m, workload: CHAT.workload };
        const best = bestQuantFor(base);
        const q4Usable = candidateQuants(m).some((q) => q !== "q3" && usable(evaluate({ ...base, quant: q }).level));
        if (q4Usable) expect(best.quant.id, `${m} on ${h}`).not.toBe("q3");
      }
    }
  });

  it("quotes the smallest version's memory when nothing fits", () => {
    const rec = rate(model("llama-3.1-8b"), hw("mba-m1-8c-8"), CHAT);
    expect(rec.level).toBe("does-not-fit");
    const sizes = candidateQuants("llama-3.1-8b")
      .filter((q) => q !== "fp16")
      .map((q) => evaluate({ hardware: hw("mba-m1-8c-8"), modelId: "llama-3.1-8b", workload: CHAT.workload, quant: q }).memory.inferencePeakGB);
    expect(rec.memory.inferencePeakGB).toBeCloseTo(Math.min(...sizes), 5);
  });
});

describe("can-i-run workloads", () => {
  it("chat and documents assume a browser, not a developer setup", () => {
    expect(WORKLOADS.find((w) => w.key === "chat")!.workload.devEnv).toBe("light");
    expect(WORKLOADS.find((w) => w.key === "docs")!.workload.devEnv).toBe("light");
    expect(CHAT_APPS_CLOSED.workload.devEnv).toBe("none");
  });

  it("8 GB Macs can run a small model once other apps are closed (as /learn/first-model says)", () => {
    const rec = rate(model("llama-3.2-3b"), hw("mba-m1-8c-8"), CHAT_APPS_CLOSED);
    expect(["does-not-fit", "unsupported"]).not.toContain(rec.level);
  });

  it("explains the memory gap with numbers that add up", () => {
    const gap = memoryGap(rate(model("qwen3-14b"), hw("mba-m1-8c-8"), CHAT));
    expect(gap.shortByGB).toBeGreaterThan(0);
    expect(gap.shortByGB).toBeCloseTo(gap.neededGB - gap.availableGB, 5);
    expect(gap.availableGB).toBeCloseTo(Math.max(0, 8 - gap.osGB - gap.appsGB - gap.toolGB), 5);
  });

  it("suggests only smaller, usable models from the same family", () => {
    const big = model("qwen3-14b");
    for (const r of smallerSiblings(big, hw("mba-m4-10c-16"))) {
      expect(r.model.family).toBe(big.family);
      expect(r.model.parameterCount).toBeLessThan(big.parameterCount);
      expect(usable(r.level)).toBe(true);
    }
  });
});
