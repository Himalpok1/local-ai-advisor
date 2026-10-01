import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";
import { HARDWARE, MODELS } from "@/data";

export const alt = "Local AI Advisor: will local AI actually run well on your computer?";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Site-wide share card; routes without their own opengraph-image use this one. */
export default async function Image() {
  const logo = await readFile(path.join(process.cwd(), "public", "brand", "logo-mark-128.png"));
  const logoSrc = `data:image/png;base64,${logo.toString("base64")}`;
  return new ImageResponse(
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        width: "100%",
        height: "100%",
        padding: 72,
        background: "linear-gradient(135deg, #0d0f17 0%, #161a2e 60%, #241f4d 100%)",
        color: "#f1f3fb",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
        <img src={logoSrc} width={64} height={64} alt="" />
        <div style={{ display: "flex", fontSize: 32, fontWeight: 700 }}>Local AI Advisor</div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <div style={{ display: "flex", fontSize: 66, lineHeight: 1.12, letterSpacing: -1.5 }}>Will local AI actually run well on your computer?</div>
        <div style={{ display: "flex", fontSize: 30, color: "#a8afc7" }}>
          {`Free check · ${MODELS.length} models · ${HARDWARE.length} computers · no sign-up`}
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", fontSize: 26, color: "#a5b4fc" }}>iownchatgpt.com</div>
    </div>,
    size,
  );
}
