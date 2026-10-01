"use client";
import { useState } from "react";
import { Check, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SaveButton } from "@/components/me/save-button";

/** Copy-link button, followed by a Save-to-account button on bookmarkable pages. */
export function ShareButton({ label = "Copy shareable link", saveLabel }: { label?: string; saveLabel?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(window.location.href);
            setCopied(true);
            setTimeout(() => setCopied(false), 1800);
          } catch {
            window.prompt("Copy this link", window.location.href);
          }
        }}
      >
        {copied ? <Check className="size-4" /> : <Share2 className="size-4" />}
        {copied ? "Link copied" : label}
      </Button>
      <SaveButton label={saveLabel} />
    </>
  );
}
