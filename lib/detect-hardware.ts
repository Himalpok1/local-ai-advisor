/**
 * Guess the visitor's machine from what the browser exposes: the WebGL
 * renderer string (GPU or Apple chip name), the platform and a coarse memory
 * hint. Everything runs locally; nothing is sent to a server.
 *
 * Browsers never reveal installed RAM precisely (Chrome caps deviceMemory at
 * 8 GB), so the result is a short list of catalog configurations to choose from.
 */
import type { HardwareConfiguration, OS } from "@/lib/schemas";

export interface HardwareSignals {
  /** UNMASKED_RENDERER_WEBGL, e.g. "ANGLE (Apple, ANGLE Metal Renderer: Apple M4 Pro, …)". */
  renderer?: string;
  /** navigator.userAgentData.platform or a platform parsed from the user agent. */
  platform?: string;
  /** navigator.deviceMemory (GB, capped at 8 by Chrome). */
  deviceMemory?: number;
}

export interface DetectionResult {
  /** What we recognized, e.g. "Apple M4 Pro" or "GeForce RTX 4090". */
  label?: string;
  os?: OS;
  candidates: HardwareConfiguration[];
  /** Why the list is empty or what the user still needs to choose. */
  hint: string;
}

export function osFromPlatform(platform?: string): OS | undefined {
  const p = (platform ?? "").toLowerCase();
  if (/mac|iphone|ipad/.test(p)) return "macos";
  if (/win/.test(p)) return "windows";
  if (/linux|x11|cros/.test(p)) return "linux";
  return undefined;
}

const tokens = (s: string) =>
  s
    .toLowerCase()
    .replace(/\(tm\)|\(r\)|®|™/g, " ")
    .replace(/\d+\s*gb\b/g, " ")
    .split(/[^a-z0-9]+/)
    .filter(Boolean);

/** Words that tell two GPUs apart beyond their model number. */
const MODIFIERS = new Set(["ti", "super", "xt", "xtx", "gre", "pro", "2x", "ada", "titan", "rtx", "gtx", "rx"]);

/** Tokens a renderer string must contain for this GPU to match. */
function requiredTokens(gpuName: string): string[] {
  return tokens(gpuName.replace(/\([^)]*\)/g, " ").replace(/×/g, "x ")).filter((t) => /\d/.test(t) || MODIFIERS.has(t));
}

export function detectHardware(signals: HardwareSignals, catalog: HardwareConfiguration[]): DetectionResult {
  const os = osFromPlatform(signals.platform);
  const renderer = signals.renderer ?? "";

  // Apple Silicon: Chrome, Edge and Firefox expose the chip ("Apple M4 Pro").
  const apple = renderer.match(/Apple (M\d+(?: Pro| Max| Ultra)?)\b/);
  if (apple) {
    const chip = apple[1];
    const candidates = catalog.filter((h) => h.vendor === "apple" && h.cpu.name === chip);
    return {
      label: `Apple ${chip}`,
      os: "macos",
      candidates,
      hint: candidates.length
        ? "Browsers can't see how much memory your Mac has. Pick your model and memory below (Apple menu → About This Mac)."
        : `We recognized an Apple ${chip}, but it isn't in our hardware catalog yet.`,
    };
  }
  if (os === "macos" && /apple/i.test(renderer)) {
    return { label: "Apple Silicon Mac", os, candidates: [], hint: "This browser hides the chip name (Safari does). Choose your Mac below, or try Chrome or Firefox." };
  }
  if (os === "macos") {
    return { os, candidates: [], hint: "This looks like an Intel Mac. Local AI runs far better on Apple Silicon; our catalog covers M-series Macs only." };
  }

  const have = new Set(tokens(renderer));
  const laptop = have.has("laptop");
  let best: HardwareConfiguration[] = [];
  let bestScore = 0;
  for (const h of catalog) {
    if (!h.gpu || h.vendor === "apple") continue;
    // NVIDIA mobile GPUs report "… Laptop GPU"; never match them to the desktop card.
    if (!!h.gpu.laptop !== laptop) continue;
    const need = requiredTokens(h.gpu.name);
    if (!need.length || !need.every((t) => have.has(t))) continue;
    if (need.length > bestScore) {
      best = [h];
      bestScore = need.length;
    } else if (need.length === bestScore) best.push(h);
  }
  if (best.length) {
    const gpu = best[0].gpu!.name.replace(/\s*\(.*\)$/, "");
    return {
      label: gpu,
      os,
      candidates: best,
      hint: best.length > 1 ? "Pick the configuration closest to yours: system RAM matters when a model spills out of VRAM." : "Check the system RAM matches yours.",
    };
  }
  if (renderer && /swiftshader|llvmpipe|software|basic render/i.test(renderer)) {
    return { os, candidates: [], hint: "Your browser is using software rendering, so we can't see the GPU. Pick your hardware below." };
  }
  return {
    label: renderer ? cleanRenderer(renderer) : undefined,
    os,
    candidates: [],
    hint: renderer ? "We couldn't match this GPU to our catalog. Pick the closest machine or enter custom specs." : "Your browser doesn't expose its GPU. Pick your hardware below.",
  };
}

/** "ANGLE (NVIDIA, NVIDIA GeForce GTX 1080 (0x…) Direct3D11 …)" → "NVIDIA GeForce GTX 1080". */
export function cleanRenderer(r: string): string {
  const inner = r.match(/^ANGLE \([^,]+,\s*([^,]+?)(?:\s*\(0x[0-9a-f]+\))?(?:\s+Direct3D.*|\s+OpenGL.*|,.*)?\)?$/i)?.[1] ?? r;
  return inner.replace(/ANGLE Metal Renderer:\s*/i, "").trim();
}

/** Read the browser signals. Client-only. */
export async function readSignals(): Promise<HardwareSignals> {
  const out: HardwareSignals = {};
  try {
    const gl = document.createElement("canvas").getContext("webgl");
    const ext = gl?.getExtension("WEBGL_debug_renderer_info");
    if (gl && ext) out.renderer = String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL));
    else if (gl) out.renderer = String(gl.getParameter(gl.RENDERER));
  } catch {
    /* WebGL disabled */
  }
  const nav = navigator as Navigator & { userAgentData?: { platform?: string }; deviceMemory?: number };
  out.platform = nav.userAgentData?.platform || navigator.platform || navigator.userAgent;
  out.deviceMemory = nav.deviceMemory;
  return out;
}
