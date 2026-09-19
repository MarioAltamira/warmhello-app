import { CheckInCard } from "@/components/check-in-card";
import { FloatingReturnButton } from "@/components/floating-return-button";
import { getCheckInPageData } from "@/lib/checkins";

type CheckInPageProps = {
  params: Promise<{ token: string }>;
  searchParams?: Promise<{ preview?: string }>;
};

const PREVIEW_TOKEN = "demo-token";

export default async function CheckInPage({ params, searchParams }: CheckInPageProps) {
  const { token } = await params;
  const resolvedSearchParams = (await searchParams) ?? {};
  const isPreview =
    token === PREVIEW_TOKEN ||
    resolvedSearchParams.preview === "1" ||
    resolvedSearchParams.preview === "true";
  const data = await getCheckInPageData(token);

  return (
    <main
      className="shell checkin-viewport-lock"
      data-checkin-preview={isPreview ? "1" : undefined}
    >
      <div className="checkin-shell-frame">
        <CheckInCard {...data} isPreview={isPreview} />
      </div>
      {isPreview ? <FloatingReturnButton /> : null}
    </main>
  );
}

