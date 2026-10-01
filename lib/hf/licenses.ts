export interface LicenseUse {
  commercial: "yes" | "no" | "conditional" | "unknown";
  note: string;
}

/** Hub ids ("apache-2.0") and catalog names ("Apache-2.0", "Gemma Terms of Use") normalize to one form. */
function normalize(license?: string): string {
  return (license ?? "").trim().toLowerCase().replace(/^(?:license:|spdx:)+/, "").replace(/\s+/g, "-");
}

/** OSI-approved licenses seen on model repositories. */
const OSI = new Set(["apache-2.0", "mit", "bsd-2-clause", "bsd-3-clause", "mpl-2.0", "gpl-2.0", "gpl-3.0", "lgpl-2.1", "lgpl-3.0", "agpl-3.0", "isc", "upl-1.0"]);

/** Summarize the declared license; the model card remains authoritative. */
export function licenseUse(license?: string): LicenseUse {
  const id = normalize(license);
  if (OSI.has(id)) return { commercial: "yes", note: "Retain the required license and attribution notices" };
  if (/^cc-(?:by-)?nc(?:-|$)/.test(id)) return { commercial: "no", note: "Non-commercial use only" };
  if (/^llama-?[234](?:\.\d+)?(?:-community-license)?$/.test(id)) return { commercial: "conditional", note: "Community license and acceptable-use restrictions apply; large services need separate permission" };
  if (["gemma", "gemma-terms-of-use"].includes(id)) return { commercial: "conditional", note: "Gemma use restrictions and redistribution terms apply" };
  if (["bigcode-openrail-m", "openrail"].includes(id)) return { commercial: "conditional", note: "Use restrictions must also apply to downstream users" };
  return { commercial: "unknown", note: "Check the model card" };
}

/**
 * How open a model's license is:
 *  - open-source: an OSI-approved license on the weights (training data may still be private)
 *  - open-weights: downloadable, but a custom license adds use restrictions
 *  - non-commercial: research / personal use only
 */
export type Openness = "open-source" | "open-weights" | "non-commercial" | "unknown";

export const OPENNESS_LABEL: Record<Openness, string> = {
  "open-source": "Open source",
  "open-weights": "Open weights (restricted)",
  "non-commercial": "Non-commercial",
  unknown: "License unclear",
};

export const OPENNESS_HINT: Record<Openness, string> = {
  "open-source": "OSI-approved license on the weights: use, modify and redistribute, including commercially. Training data may still be private.",
  "open-weights": "Free to download, but a custom license adds use or redistribution restrictions.",
  "non-commercial": "Research and personal use only.",
  unknown: "We couldn't classify this license. Check the model card.",
};

export function licenseOpenness(license?: string): Openness {
  if (OSI.has(normalize(license))) return "open-source";
  const use = licenseUse(license);
  if (use.commercial === "no") return "non-commercial";
  if (use.commercial === "conditional") return "open-weights";
  return "unknown";
}
