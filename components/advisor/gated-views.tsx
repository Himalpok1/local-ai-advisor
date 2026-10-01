"use client";
import type { ComponentProps } from "react";
import { HfModelGate } from "./hf-gate";
import { EvaluationView } from "./evaluation-view";
import { HardwareSearch } from "./hardware-search";
import { CompareModels } from "./compare-models";
import { CompareHardware } from "./compare-hardware";
import { StackBuilder } from "./stack-builder";

/* Client wrappers that import any hf: models referenced in the URL before rendering. */

export function GatedEvaluation(props: ComponentProps<typeof EvaluationView>) {
  return <HfModelGate ids={[props.initial.modelId]}>{() => <EvaluationView {...props} />}</HfModelGate>;
}
export function GatedHardwareSearch(props: ComponentProps<typeof HardwareSearch>) {
  return <HfModelGate ids={[props.initial.modelId]}>{() => <HardwareSearch {...props} />}</HfModelGate>;
}
export function GatedCompareModels(props: ComponentProps<typeof CompareModels>) {
  return <HfModelGate ids={props.initialModels.map((m) => m.id)}>{() => <CompareModels {...props} />}</HfModelGate>;
}
export function GatedCompareHardware(props: ComponentProps<typeof CompareHardware>) {
  return <HfModelGate ids={[props.initial.modelId]}>{() => <CompareHardware {...props} />}</HfModelGate>;
}
export function GatedStackBuilder(props: ComponentProps<typeof StackBuilder>) {
  return <HfModelGate ids={[props.initial.modelId]}>{() => <StackBuilder {...props} />}</HfModelGate>;
}
