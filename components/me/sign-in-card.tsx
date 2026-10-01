"use client";
import { signIn } from "next-auth/react";
import { LogIn } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function SignInCard() {
  return (
    <Card className="space-y-4 p-6 sm:p-8">
      <h1 className="text-2xl font-semibold tracking-tight">Sign in to keep your rigs</h1>
      <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
        <li>Save your computers and pick them in one tap in every tool</li>
        <li>Bookmark evaluations, comparisons and stacks</li>
        <li>See which new open models run well on your rigs</li>
        <li>Report real speeds to improve the estimates</li>
      </ul>
      <Button onClick={() => signIn("google", { redirectTo: "/me" })}>
        <LogIn className="size-4" /> Sign in with Google
      </Button>
    </Card>
  );
}
