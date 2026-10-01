import type { DevEnvPreset, DevelopmentEnvironment } from "@/lib/schemas";

/** Memory other applications typically keep resident while you work (GB). */
export const DEV_ENVIRONMENTS: Record<DevEnvPreset, DevelopmentEnvironment> = {
  none: {
    preset: "none",
    label: "Nothing else",
    description: "Dedicated machine or server: only the inference runtime is running.",
    reserveGB: 0,
  },
  light: {
    preset: "light",
    label: "Light",
    description: "Editor + browser with a few tabs.",
    reserveGB: 3,
  },
  normal: {
    preset: "normal",
    label: "Normal",
    description: "Editor + browser + dev server + terminal.",
    reserveGB: 6,
  },
  heavy: {
    preset: "heavy",
    label: "Heavy",
    description: "Editor + browser + Docker containers + database + dev servers.",
    reserveGB: 12,
  },
  "very-heavy": {
    preset: "very-heavy",
    label: "Very heavy",
    description: "Docker + multiple services + emulator/simulator + browser + IDE + databases.",
    reserveGB: 20,
  },
  custom: {
    preset: "custom",
    label: "Custom",
    description: "Your own estimate of memory used by other applications.",
    reserveGB: 8,
  },
};

export const DEV_ENV_LIST = Object.values(DEV_ENVIRONMENTS);

export function devEnvReserveGB(preset: DevEnvPreset, customGB?: number): number {
  if (preset === "custom") return customGB ?? DEV_ENVIRONMENTS.custom.reserveGB;
  return DEV_ENVIRONMENTS[preset].reserveGB;
}
