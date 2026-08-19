import { ImageResponse } from "next/og";

export const runtime = "edge";
export const contentType = "image/png";
export const size = { width: 1200, height: 675 };
export const alt =
  "Warm-Hello - Gentle daily SMS check-ins for seniors living alone.";

const DEFAULT_TITLE = "Warm-Hello";
const DEFAULT_SUBTITLE =
  "Gentle daily SMS check-ins for seniors living alone.";

function splitTitle(input: string, maxChars: number): string[] {
  if (!input) return [DEFAULT_TITLE, DEFAULT_SUBTITLE];
  if (input.length <= maxChars) return [input];
  const words = input.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > maxChars && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }
  if (current) lines.push(current);
  if (lines.length === 0) lines.push(DEFAULT_TITLE);
  if (lines.length === 1) lines.push(DEFAULT_SUBTITLE);
  return lines.slice(0, 3);
}

type Props = {
  params?: Record<string, unknown>;
  searchParams?: {
    title?: string;
    text?: string;
    subtitle?: string;
  };
};

export default async function Image(props: Props) {
  const q = props.searchParams ?? {};
  const rawTitle = q.title ?? q.text ?? "";
  const subtitle = q.subtitle ?? DEFAULT_SUBTITLE;
  const title = rawTitle.trim() || DEFAULT_TITLE;
  const titleLines = splitTitle(title, 34);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background:
            "linear-gradient(160deg, #0b1220 0%, #131d3e 40%, #1e3a7a 75%, #2e5fb6 100%)",
          color: "#f8fafc",
          fontFamily: '"Inter", ui-sans-serif, system-ui, sans-serif',
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "80px 90px 70px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
          }}
        >
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 16,
              background:
                "radial-gradient(circle at 30% 20%, #ffffff 0%, #fef3c7 45%, #f59e0b 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 26,
              fontWeight: 800,
              color: "#7c2d12",
              letterSpacing: "-0.02em",
            }}
          >
            W
          </div>
          <div
            style={{
              fontSize: 26,
              fontWeight: 800,
              letterSpacing: "-0.02em",
              lineHeight: 1.05,
            }}
          >
            Warm-Hello · Twitter / X
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 22,
            maxWidth: 1040,
          }}
        >
          {titleLines.map((line, idx) => (
            <div
              key={idx}
              style={{
                fontSize: idx === 0 ? 68 : 54,
                fontWeight: 800,
                lineHeight: 1.05,
                letterSpacing: "-0.025em",
                color: "#ffffff",
                textShadow: "0 3px 24px rgba(0,0,0,0.22)",
              }}
            >
              {line}
            </div>
          ))}

          <div
            style={{
              fontSize: 28,
              lineHeight: 1.35,
              color: "rgba(226,232,240,0.86)",
              fontWeight: 500,
              maxWidth: 900,
            }}
          >
            {subtitle}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div
            style={{
              fontSize: 18,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              color: "rgba(226,232,240,0.64)",
              fontWeight: 700,
            }}
          >
            Summary large card · 2:1
          </div>
          <div
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: "#ffffff",
            }}
          >
            warm-hello.com
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
