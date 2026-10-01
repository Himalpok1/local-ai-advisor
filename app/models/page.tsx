import type { Metadata } from "next";
import { Info } from "lucide-react";
import { MODELS, QUANTIZATIONS } from "@/data";
import type { Model, QuantId } from "@/lib/schemas";
import { weightsGB } from "@/lib/memory";
import { Callout, ExplorePage } from "@/components/explore/explore-nav";
import { ModelsExplorer, type ModelRow } from "@/components/explore/models-explorer";

export const metadata: Metadata = {
  title: "Model catalog",
  description:
    "Browse the open-weight models Local AI Advisor knows about: parameters, MoE vs dense, context window, vision, tool calling, 4-bit size, license and sources.",
  alternates: { canonical: "/models" },
};

/** Reference 4-bit quant: Q4 when published, otherwise native MXFP4 (gpt-oss), else the smallest supported. */
function referenceQuant(m: Model): QuantId {
  if (m.supportedQuantizations.includes("q4")) return "q4";
  if (m.supportedQuantizations.includes("mxfp4")) return "mxfp4";
  return m.supportedQuantizations[0];
}

export default function ModelsPage() {
  const rows: ModelRow[] = MODELS.map((model) => {
    const quant = QUANTIZATIONS[referenceQuant(model)];
    return { model, q4GB: weightsGB(model, quant, "gguf"), q4Label: quant.formatNames.gguf ?? quant.label };
  });

  return (
    <ExplorePage
      current="models"
      title="Model catalog"
      intro="Every open-weight model the advisor can evaluate, with the specs that decide whether it will run comfortably on your machine."
    >
      <Callout icon={<Info className="size-4" />} title="No model is “recommended” here">
        The catalog only stores facts (size, architecture, context, licence) and <strong>editorial capability tiers</strong>. It never stores a
        recommendation status: whether a model is <em>comfortable</em> is derived by the engine for your specific hardware, runtime, tool and
        workload. Use “What hardware do I need?” on any model to see that analysis.
      </Callout>
      <ModelsExplorer rows={rows} />
    </ExplorePage>
  );
}
