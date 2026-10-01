import { z } from "zod";
import { OSSchema, WorkloadProfileSchema } from "@/lib/schemas";
import { CustomHardwareSchema, resolveHardware, type AppState } from "@/lib/share";
import { TOOL_MAP } from "@/data";

const StoredState = z.object({
  hardwareId: z.string(),
  custom: CustomHardwareSchema.optional(),
  os: OSSchema.optional(),
  workload: WorkloadProfileSchema.refine((w) => TOOL_MAP.has(w.toolId)),
});

/** Validate persisted state as a whole; invalid data never reaches the engine. */
export function readHfState(raw: string | null): AppState | undefined {
  try {
    if (!raw) return undefined;
    const state = StoredState.parse(JSON.parse(raw));
    const hardware = resolveHardware(state);
    if (!hardware || (state.os && !hardware.os.includes(state.os))) return undefined;
    return state;
  } catch { return undefined; }
}
