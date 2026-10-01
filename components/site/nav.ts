import {
  BookOpen,
  Boxes,
  Calculator,
  Compass,
  Cpu,
  Gauge,
  HardDrive,
  HelpCircle,
  Home,
  Layers,
  type LucideIcon,
  Rss,
  Scale,
  Search,
  Server,
  Users,
  Wrench,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  /** One plain-language line for menus. */
  description: string;
  icon: LucideIcon;
}

export interface NavGroup {
  title: string;
  items: NavItem[];
}

/** The four destinations a newcomer needs; everything else lives under "Tools". */
export const PRIMARY_NAV: NavItem[] = [
  { href: "/check", label: "Check my computer", description: "Answer a few questions, get models that run well", icon: Compass },
  { href: "/can-i-run", label: "Can I run it?", description: "Pick a model, see if your computer can handle it", icon: HelpCircle },
  { href: "/learn", label: "Learn", description: "Local AI explained in 10 short lessons", icon: BookOpen },
];

export const TOOL_GROUPS: NavGroup[] = [
  {
    title: "Find a model",
    items: [
      { href: "/check", label: "Check my computer", description: "A short quiz that recommends models for you", icon: Compass },
      { href: "/can-i-run", label: "Can I run it?", description: "Every popular model on every popular computer", icon: HelpCircle },
      { href: "/new-models", label: "New models", description: "The latest open releases, rated for real machines", icon: Rss },
      { href: "/hugging-face", label: "Any Hugging Face model", description: "Paste a link and we check it for you", icon: Search },
    ],
  },
  {
    title: "Compare & plan",
    items: [
      { href: "/compare/models", label: "Compare models", description: "Put models side by side on your computer", icon: Scale },
      { href: "/compare/hardware", label: "Compare computers", description: "Which machine suits what you want to do", icon: Cpu },
      { href: "/hardware-for-model", label: "Hardware for a model", description: "What you need to buy to run a model well", icon: HardDrive },
      { href: "/stack", label: "Build a setup", description: "Computer, app and model, with install steps", icon: Layers },
    ],
  },
  {
    title: "Measure & share",
    items: [
      { href: "/speed-test", label: "Speed test", description: "Measure your GPU in the browser in 5 seconds", icon: Gauge },
      { href: "/community", label: "Community speeds", description: "Real speeds reported by other people", icon: Users },
    ],
  },
  {
    title: "Browse the data",
    items: [
      { href: "/models", label: "Models", description: "Every model we rate, with filters", icon: Boxes },
      { href: "/hardware", label: "Computers", description: "Macs, GPUs and AI PCs with their specs", icon: Server },
      { href: "/runtimes", label: "Runtimes", description: "Ollama, LM Studio, llama.cpp, MLX…", icon: Wrench },
      { href: "/tools", label: "AI apps", description: "Chat apps and coding agents that use local models", icon: Boxes },
      { href: "/methodology", label: "How we calculate", description: "The math and sources behind every rating", icon: Calculator },
    ],
  },
];

/** Bottom tab bar on phones: max five top-level destinations. */
export const TAB_NAV = [
  { href: "/", label: "Home", icon: Home },
  { href: "/check", label: "Check", icon: Compass },
  { href: "/can-i-run", label: "Can I run", icon: HelpCircle },
  { href: "/learn", label: "Learn", icon: BookOpen },
] as const;

/** Which top-level section a path belongs to, for highlighting. */
export function sectionFor(pathname: string): string {
  if (pathname === "/") return "/";
  if (pathname.startsWith("/check")) return "/check";
  if (pathname.startsWith("/can-i-run") || pathname.startsWith("/what-runs-on")) return "/can-i-run";
  if (pathname.startsWith("/learn")) return "/learn";
  return "tools";
}
