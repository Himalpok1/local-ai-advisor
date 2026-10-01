"use client";
import { useEffect } from "react";
import { markNewModelsSeen } from "@/lib/me/actions";

/** Marks new-model alerts as read once the page has shown them (clears the menu badge next load). */
export function MarkNewModelsSeen() {
  useEffect(() => {
    markNewModelsSeen().catch(() => {});
  }, []);
  return null;
}
