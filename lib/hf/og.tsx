import "server-only";
import { ImageResponse } from "next/og";
import { hfSummary } from "./summary";
import { HfError } from "./fetch";

/** Render a share card with an explicitly estimated default-hardware verdict. */
export async function hfOgImage(repo?: string) {
  let name = "Check any Hugging Face model";
  let detail = "Will it run comfortably on your hardware?";
  let verdict = "Architecture facts. Workload-aware estimates.";
  if (repo) {
    name = repo;
    try {
      const summary = await hfSummary(repo);
      name = summary.parsed.model.name;
      detail = `${summary.parsed.model.parameterCount}B parameters • ${summary.parsed.model.source.confidence} confidence`;
      verdict = `Estimated: ${summary.verdict} • M4 Pro 48GB • repository coding`;
    } catch (error) {
      const ineligible = error instanceof HfError && error.status === 422;
      detail = ineligible ? "Conversational eligibility could not be established" : "Model facts temporarily unavailable";
      verdict = ineligible ? "No chat comfort or generation-speed rating" : "Open the interactive lookup to retry";
    }
  }
  return new ImageResponse(<div style={{ display: "flex", flexDirection: "column", justifyContent: "center", width: "100%", height: "100%", padding: 70, background: "#101827", color: "#f1f5f9", gap: 28 }}>
    <div style={{ display: "flex", fontSize: 30, color: "#6ee7b7" }}>Local AI Advisor</div>
    <div style={{ display: "flex", fontSize: 58, fontWeight: 700 }}>{name}</div>
    <div style={{ display: "flex", fontSize: 30 }}>{detail}</div>
    <div style={{ display: "flex", fontSize: 27, color: "#a7f3d0" }}>{verdict}</div>
  </div>, { width: 1200, height: 630 });
}
