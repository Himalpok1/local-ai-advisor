import { describe, expect, it } from "vitest";
import { HARDWARE } from "@/data";
import { cleanRenderer, detectHardware } from "@/lib/detect-hardware";

const ids = (renderer: string, platform = "Windows") => detectHardware({ renderer, platform }, HARDWARE).candidates.map((h) => h.id);

describe("detectHardware", () => {
  it("matches an Apple chip to every Mac that uses it", () => {
    const r = detectHardware({ renderer: "ANGLE (Apple, ANGLE Metal Renderer: Apple M4 Pro, Unspecified Version)", platform: "macOS" }, HARDWARE);
    expect(r.label).toBe("Apple M4 Pro");
    expect(r.os).toBe("macos");
    expect(r.candidates.map((h) => h.id)).toEqual(expect.arrayContaining(["mbp-m4-pro-20c-48", "mini-m4-pro-20c-64"]));
    expect(r.candidates.every((h) => h.cpu.name === "M4 Pro")).toBe(true);
  });

  it("does not confuse M4 with M4 Pro or M4 Max", () => {
    const r = detectHardware({ renderer: "Apple M4", platform: "macOS" }, HARDWARE);
    expect(r.candidates.length).toBeGreaterThan(0);
    expect(r.candidates.every((h) => h.cpu.name === "M4")).toBe(true);
  });

  it("explains Safari's masked renderer", () => {
    const r = detectHardware({ renderer: "Apple GPU", platform: "macOS" }, HARDWARE);
    expect(r.candidates).toEqual([]);
    expect(r.hint).toMatch(/Safari/);
  });

  it("matches desktop NVIDIA cards from a Windows ANGLE string", () => {
    expect(ids("ANGLE (NVIDIA, NVIDIA GeForce RTX 4090 (0x00002684) Direct3D11 vs_5_0 ps_5_0, D3D11)").sort()).toEqual(["pc-rtx-4090-32", "pc-rtx-4090-64"]);
  });

  it("prefers the more specific card name", () => {
    expect(ids("NVIDIA GeForce RTX 5070 Ti/PCIe/SSE2", "Linux x86_64")).toEqual(["pc-rtx-5070-ti-32"]);
    expect(ids("ANGLE (NVIDIA, NVIDIA GeForce RTX 4060 Ti (0x00002803) Direct3D11 vs_5_0 ps_5_0, D3D11)")).toEqual(["pc-rtx-4060-ti-16-32"]);
  });

  it("keeps laptop and desktop GPUs apart", () => {
    expect(ids("ANGLE (NVIDIA, NVIDIA GeForce RTX 4090 Laptop GPU (0x00002757) Direct3D11 vs_5_0 ps_5_0, D3D11)")).toEqual(["laptop-rtx-4090-laptop-32"]);
    expect(ids("ANGLE (NVIDIA, NVIDIA GeForce RTX 4060 (0x00002882) Direct3D11 vs_5_0 ps_5_0, D3D11)")).toEqual([]);
  });

  it("matches AMD and Intel GPUs, including integrated ones", () => {
    expect(ids("ANGLE (AMD, AMD Radeon RX 7900 XTX (0x0000744C) Direct3D11 vs_5_0 ps_5_0, D3D11)").sort()).toEqual(["pc-rx-7900-xtx-32", "pc-rx-7900-xtx-64"]);
    expect(ids("ANGLE (AMD, AMD Radeon(TM) 8060S Graphics (0x00001586) Direct3D11 vs_5_0 ps_5_0, D3D11)").sort()).toEqual(["strix-halo-395-128", "strix-halo-395-64"]);
    expect(ids("ANGLE (Intel, Intel(R) Arc(TM) 140V GPU (16GB) (0x000064A0) Direct3D11 vs_5_0 ps_5_0, D3D11)")).toEqual(["laptop-core-ultra-258v-32"]);
    expect(ids("ANGLE (Intel, Intel(R) Arc(TM) B580 Graphics (0x0000E20B) Direct3D11 vs_5_0 ps_5_0, D3D11)")).toEqual(["pc-arc-b580-32"]);
  });

  it("reports unknown GPUs by a readable name", () => {
    const r = detectHardware({ renderer: "ANGLE (NVIDIA, NVIDIA GeForce GTX 1080 (0x00001B80) Direct3D11 vs_5_0 ps_5_0, D3D11)", platform: "Windows" }, HARDWARE);
    expect(r.candidates).toEqual([]);
    expect(r.label).toBe("NVIDIA GeForce GTX 1080");
  });

  it("recognizes newly added workstation and named TITAN GPUs", () => {
    expect(ids("NVIDIA TITAN RTX/PCIe/SSE2").sort()).toEqual(["pc-titan-rtx-32", "pc-titan-rtx-64"]);
    expect(ids("NVIDIA RTX A6000/PCIe/SSE2").sort()).toEqual(["pc-rtx-a6000-128", "pc-rtx-a6000-64"]);
    expect(ids("NVIDIA RTX 6000 Ada Generation").sort()).toEqual(["pc-rtx-6000-ada-128", "pc-rtx-6000-ada-64"]);
    expect(ids("AMD Radeon RX 6000")).toEqual([]);
  });

  it("cleans renderer strings", () => {
    expect(cleanRenderer("ANGLE (Intel, Mesa Intel(R) UHD Graphics 630 (CFL GT2), OpenGL ES 3.2)")).toBe("Mesa Intel(R) UHD Graphics 630 (CFL GT2)");
  });
});
