import { hfOgImage } from "@/lib/hf/og";
export const alt = "Local AI Advisor — check a Hugging Face model";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export default function Image() { return hfOgImage(); }
