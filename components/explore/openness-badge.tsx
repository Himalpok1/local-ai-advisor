import { OPENNESS_HINT, OPENNESS_LABEL, licenseOpenness } from "@/lib/hf/licenses";
import { Badge } from "@/components/ui/badge";

/** "Open source" / "Open weights (restricted)" / "Non-commercial" for a declared license. */
export function OpennessBadge({ license, className }: { license?: string; className?: string }) {
  const o = licenseOpenness(license);
  if (o === "unknown") return null;
  return (
    <Badge tone={o === "open-source" ? "good" : o === "non-commercial" ? "bad" : "warn"} title={OPENNESS_HINT[o]} className={className}>
      {OPENNESS_LABEL[o]}
    </Badge>
  );
}
