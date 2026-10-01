"use client";
import { useState, useTransition } from "react";
import { moderateSpeedReport } from "@/lib/me/actions";
import { Button } from "@/components/ui/button";

export function ModerateButtons({ id }: { id: string }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string>();
  const act = (status: "approved" | "rejected") =>
    start(async () => {
      const res = await moderateSpeedReport(id, status);
      if (!res.ok) setError(res.error);
    });
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button size="sm" disabled={pending} onClick={() => act("approved")}>
        Approve
      </Button>
      <Button size="sm" variant="outline" disabled={pending} onClick={() => act("rejected")}>
        Reject
      </Button>
      {error && <span className="text-xs text-borderline">{error}</span>}
    </div>
  );
}
