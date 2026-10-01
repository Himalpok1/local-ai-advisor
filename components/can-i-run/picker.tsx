"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { hardwareSlug } from "@/lib/slugs";
import { Field, Select } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { DetectHardware } from "@/components/advisor/detect-hardware";

export interface PickerOption {
  value: string;
  label: string;
  group?: string;
}

/** Model + machine picker that jumps to the static answer page. */
export function CanIRunPicker({ models, hardware }: { models: PickerOption[]; hardware: PickerOption[] }) {
  const router = useRouter();
  const [model, setModel] = useState(models[0]?.value);
  const [hw, setHw] = useState<string>();

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (model && hw) router.push(`/can-i-run/${model}/${hw}`);
        else if (model) router.push(`/can-i-run/${model}`);
        else if (hw) router.push(`/what-runs-on/${hw}`);
      }}
      className="space-y-4"
    >
      <div className="grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <Field label="Model">
          <Select ariaLabel="Model" value={model} onChange={setModel} options={models} />
        </Field>
        <Field label="Your computer">
          <Select ariaLabel="Computer" value={hw ?? ""} onChange={setHw} options={[{ value: "", label: "Any machine (show all)" }, ...hardware]} />
        </Field>
        <Button type="submit">
          Can it run? <ArrowRight className="size-4" aria-hidden />
        </Button>
      </div>
      <DetectHardware onPick={(h) => setHw(hardwareSlug(h))} selectedId={undefined} />
    </form>
  );
}
