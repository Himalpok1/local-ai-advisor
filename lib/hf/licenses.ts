export interface LicenseUse {
  commercial: "yes" | "no" | "conditional" | "unknown";
  note: string;
}

/** Summarize the declared license; the model card remains authoritative. */
export function licenseUse(license?: string): LicenseUse {
  const id = license?.trim().toLowerCase().replace(/^(?:license:|spdx:)+/, "");
  if (["apache-2.0", "mit", "bsd-3-clause"].includes(id ?? "")) return { commercial: "yes", note: "Retain the required license and attribution notices" };
  if (/^cc-(?:by-)?nc(?:-|$)/.test(id ?? "")) return { commercial: "no", note: "Non-commercial use only" };
  if (/^llama[234](?:\.\d+)?$/.test(id ?? "")) return { commercial: "conditional", note: "Community license and acceptable-use restrictions apply; large services need separate permission" };
  if (["gemma", "gemma-terms-of-use"].includes(id ?? "")) return { commercial: "conditional", note: "Gemma use restrictions and redistribution terms apply" };
  if (["bigcode-openrail-m", "openrail"].includes(id ?? "")) return { commercial: "conditional", note: "Use restrictions must also apply to downstream users" };
  return { commercial: "unknown", note: "Check the model card" };
}
