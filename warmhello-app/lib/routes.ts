export const trialAuthHref = "/auth?mode=signup&redirect=%2Fonboard&source=trial";
export const protectAuthHref = "/auth?mode=signup&redirect=%2Fonboard&source=protect";
export const dashboardAuthHref = "/dashboard";

export const legalLinks = {
  terms: "/terms",
  privacy: "/privacy",
} as const;

export function sanitizeRedirect(raw: string | null | undefined): string {
  if (!raw) return "/dashboard";
  if (raw.startsWith("/dashboard") || raw === "/onboard") return raw;
  return "/dashboard";
}
