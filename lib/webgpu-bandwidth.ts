/**
 * Measure GPU memory read bandwidth in the browser with WebGPU.
 *
 * Token generation is bound by how fast the GPU can stream the model's weights
 * from memory, so read bandwidth is the single best predictor of tokens/second.
 * A compute shader repeatedly reads a buffer far larger than any GPU cache;
 * bytes read ÷ wall time gives the achieved bandwidth. Nothing is downloaded.
 */

// Minimal WebGPU typings so this compiles without @webgpu/types.
/* eslint-disable @typescript-eslint/no-explicit-any */
type GPU = any;

export interface BandwidthResult {
  /** Median achieved read bandwidth, GB/s (decimal). */
  gbps: number;
  /** Best run, GB/s. */
  bestGbps: number;
  bufferMB: number;
  runs: number[];
  adapter: { vendor?: string; architecture?: string; description?: string };
}

export class BenchmarkError extends Error {}

const SHADER = /* wgsl */ `
@group(0) @binding(0) var<storage, read> src: array<vec4<u32>>;
@group(0) @binding(1) var<storage, read_write> dst: array<u32>;

@compute @workgroup_size(256)
fn main(@builtin(global_invocation_id) gid: vec3<u32>, @builtin(num_workgroups) groups: vec3<u32>) {
  let stride = groups.x * 256u;
  let n = arrayLength(&src);
  var acc = vec4<u32>(0u);
  var i = gid.x;
  loop {
    if (i >= n) { break; }
    acc = acc ^ src[i];
    i = i + stride;
  }
  // Practically never true; stops the compiler from removing the reads.
  if (all(acc == vec4<u32>(0x9e3779b9u))) { dst[gid.x] = acc.x; }
}`;

const MB = 1024 * 1024;
const WORKGROUPS = 8192;

export function webgpuAvailable(): boolean {
  return typeof navigator !== "undefined" && "gpu" in navigator;
}

export function bytesToGbps(bytes: number, ms: number): number {
  return bytes / (ms / 1000) / 1e9;
}

export function median(xs: number[]): number {
  const s = [...xs].sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

export async function measureBandwidth(onProgress?: (fraction: number) => void): Promise<BandwidthResult> {
  if (!webgpuAvailable()) throw new BenchmarkError("This browser doesn't support WebGPU. Try a recent Chrome, Edge or Safari.");
  const gpu: GPU = (navigator as any).gpu;
  const adapter = await gpu.requestAdapter({ powerPreference: "high-performance" });
  if (!adapter) throw new BenchmarkError("WebGPU is turned off or no GPU is available to the browser.");

  const deviceMemory = (navigator as any).deviceMemory as number | undefined;
  const limit = Math.min(adapter.limits.maxStorageBufferBindingSize, adapter.limits.maxBufferSize);
  const target = (deviceMemory && deviceMemory <= 4 ? 256 : 512) * MB;
  const bytes = Math.floor(Math.min(target, limit) / (16 * MB)) * 16 * MB;
  if (bytes < 64 * MB) throw new BenchmarkError("The GPU only allows small buffers, so bandwidth can't be measured reliably.");

  const device = await adapter.requestDevice({ requiredLimits: { maxStorageBufferBindingSize: bytes, maxBufferSize: bytes } });
  const GPUBufferUsage = (globalThis as any).GPUBufferUsage;
  const src = device.createBuffer({ size: bytes, usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST });
  const dst = device.createBuffer({ size: WORKGROUPS * 256 * 4, usage: GPUBufferUsage.STORAGE });
  try {
    // Random contents so no hardware compression can shortcut the reads.
    const chunk = new Uint32Array((16 * MB) / 4);
    for (let i = 0; i < chunk.length; i++) chunk[i] = (Math.random() * 2 ** 32) >>> 0;
    for (let off = 0; off < bytes; off += chunk.byteLength) device.queue.writeBuffer(src, off, chunk);

    const pipeline = device.createComputePipeline({ layout: "auto", compute: { module: device.createShaderModule({ code: SHADER }), entryPoint: "main" } });
    const bind = device.createBindGroup({
      layout: pipeline.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: { buffer: src } },
        { binding: 1, resource: { buffer: dst } },
      ],
    });

    const run = async (passes: number) => {
      const encoder = device.createCommandEncoder();
      for (let p = 0; p < passes; p++) {
        const pass = encoder.beginComputePass();
        pass.setPipeline(pipeline);
        pass.setBindGroup(0, bind);
        pass.dispatchWorkgroups(WORKGROUPS);
        pass.end();
      }
      const t0 = performance.now();
      device.queue.submit([encoder.finish()]);
      await device.queue.onSubmittedWorkDone();
      return performance.now() - t0;
    };

    await device.queue.onSubmittedWorkDone();
    // Warm up, then size each run to take roughly a quarter of a second.
    await run(2);
    const perPass = (await run(4)) / 4;
    const passes = Math.max(2, Math.min(64, Math.ceil(250 / Math.max(perPass, 0.5))));
    onProgress?.(0.1);

    const runs: number[] = [];
    const total = 7;
    for (let r = 0; r < total; r++) {
      runs.push(bytesToGbps(bytes * passes, await run(passes)));
      onProgress?.(0.1 + (0.9 * (r + 1)) / total);
    }
    const info = adapter.info ?? {};
    return {
      gbps: median(runs),
      bestGbps: Math.max(...runs),
      bufferMB: bytes / MB,
      runs,
      adapter: { vendor: info.vendor || undefined, architecture: info.architecture || undefined, description: info.description || undefined },
    };
  } finally {
    src.destroy();
    dst.destroy();
    device.destroy();
  }
}
