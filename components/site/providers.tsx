"use client";
import { SessionProvider } from "next-auth/react";

// Session is fetched client-side so every page can stay statically rendered.
export function Providers({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
