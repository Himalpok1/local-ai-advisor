"use client";
import { useState, useTransition } from "react";
import Link from "next/link";
import { ArrowRight, Pencil, Star, Trash2 } from "lucide-react";
import { WORKLOADS } from "@/lib/can-i-run";
import { encodeState } from "@/lib/share";
import { decodeRig, type RigDto } from "@/lib/me/shared";
import { deleteRig, renameRig, setDefaultRig, updateRigQuery } from "@/lib/me/actions";
import { osLabel } from "@/lib/compatibility";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/form";
import { buttonClass } from "@/components/ui/button";
import { hardwareSpecLine } from "@/components/advisor/hardware-picker";
import { workloadLabel } from "@/components/advisor/workload-form";
import { ActionButton } from "./action-button";

export function RigList({ rigs }: { rigs: RigDto[] }) {
  return (
    <ul className="grid gap-4 md:grid-cols-2">
      {rigs.map((rig) => (
        <li key={rig.id}>
          <RigCard rig={rig} />
        </li>
      ))}
    </ul>
  );
}

function RigCard({ rig }: { rig: RigDto }) {
  const decoded = decodeRig(rig);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(rig.name);
  const [pending, start] = useTransition();

  if (!decoded) {
    return (
      <Card className="flex items-center justify-between gap-3 p-5 text-sm">
        <span>
          <strong>{rig.name}</strong> uses hardware that&apos;s no longer in the catalog.
        </span>
        <ActionButton action={deleteRig.bind(null, rig.id)}>
          <Trash2 className="size-3.5" aria-hidden /> Remove
        </ActionButton>
      </Card>
    );
  }
  const { state, hardware } = decoded;
  const preset = WORKLOADS.find((w) => w.workload.useCase === state.workload.useCase && w.workload.toolId === state.workload.toolId);

  return (
    <Card className="flex h-full flex-col gap-3 p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        {editing ? (
          <form
            className="flex flex-1 gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              start(async () => {
                const res = await renameRig(rig.id, name);
                if (res.ok) setEditing(false);
              });
            }}
          >
            <input autoFocus value={name} onChange={(e) => setName(e.target.value)} maxLength={80} aria-label="Rig name" className="h-8 min-w-0 flex-1 rounded-lg border-2 bg-card px-2.5 text-sm" />
            <button type="submit" disabled={pending || !name.trim()} className={buttonClass("primary", "sm")}>
              Save
            </button>
          </form>
        ) : (
          <div className="min-w-0">
            <h3 className="flex items-center gap-2 font-semibold">
              {rig.name}
              {rig.isDefault && (
                <Badge tone="primary">
                  <Star className="size-3 fill-current" aria-hidden /> Default
                </Badge>
              )}
            </h3>
            <p className="text-sm text-muted-foreground">
              {hardware.name}
              {state.os && hardware.os.length > 1 ? ` · ${osLabel(state.os)}` : ""}
            </p>
            <p className="text-xs text-muted-foreground">{hardwareSpecLine(hardware)}</p>
          </div>
        )}
        {!editing && (
          <button type="button" onClick={() => setEditing(true)} className="text-muted-foreground hover:text-foreground cursor-pointer" aria-label={`Rename ${rig.name}`}>
            <Pencil className="size-4" />
          </button>
        )}
      </div>

      <label className="block text-sm">
        <span className="mb-1 block text-xs font-medium text-muted-foreground">Mostly used for (drives alerts and “what it runs”)</span>
        <Select
          ariaLabel="Mostly used for"
          value={preset?.key ?? "current"}
          onChange={(key) => {
            const next = WORKLOADS.find((w) => w.key === key);
            if (next) start(async () => void (await updateRigQuery(rig.id, encodeState({ ...state, workload: next.workload }))));
          }}
          options={[...(preset ? [] : [{ value: "current", label: workloadLabel(state.workload) }]), ...WORKLOADS.map((w) => ({ value: w.key, label: w.label }))]}
        />
      </label>

      <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-2 pt-1">
        <Link href={`/check?${rig.query}`} className={buttonClass("outline", "sm")}>
          What it runs <ArrowRight className="size-3.5" aria-hidden />
        </Link>
        {!rig.isDefault && (
          <ActionButton action={setDefaultRig.bind(null, rig.id)}>
            <Star className="size-3.5" aria-hidden /> Make default
          </ActionButton>
        )}
        <ActionButton action={deleteRig.bind(null, rig.id)} confirm={`Delete “${rig.name}”?`} className="hover:text-borderline">
          <Trash2 className="size-3.5" aria-hidden /> Delete
        </ActionButton>
      </div>
    </Card>
  );
}
