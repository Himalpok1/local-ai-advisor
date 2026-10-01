import { describe, expect, it } from "vitest";
import { getModel } from "@/data";
import { ceilingTps, interpretBandwidth } from "@/lib/speed-test";
import { bytesToGbps, median } from "@/lib/webgpu-bandwidth";

describe("speed test math", () => {
  it("converts bytes and milliseconds to GB/s", () => {
    expect(bytesToGbps(2e9, 1000)).toBe(2);
    expect(bytesToGbps(512 * 1024 * 1024 * 10, 20)).toBeCloseTo(268.4, 1);
  });

  it("takes the median of runs", () => {
    expect(median([3, 1, 2])).toBe(2);
    expect(median([4, 1, 3, 2])).toBe(2.5);
  });

  it("caps generation at bandwidth ÷ active weights", () => {
    const dense = getModel("qwen3.6-27b");
    const moe = getModel("qwen3.6-35b-a3b");
    // ~16 GB of Q4 weights at 273 GB/s → under 20 tok/s.
    expect(ceilingTps(273, dense)).toBeGreaterThan(12);
    expect(ceilingTps(273, dense)).toBeLessThan(20);
    // MoE reads only its active experts, so the ceiling is far higher.
    expect(ceilingTps(273, moe)).toBeGreaterThan(5 * ceilingTps(273, dense));
  });

  it("flags a measurement far below the spec", () => {
    expect(interpretBandwidth(200, 273)?.tone).toBe("good");
    expect(interpretBandwidth(110, 273)?.tone).toBe("warn");
    expect(interpretBandwidth(40, 273)?.tone).toBe("bad");
    expect(interpretBandwidth(40)).toBeUndefined();
  });
});
