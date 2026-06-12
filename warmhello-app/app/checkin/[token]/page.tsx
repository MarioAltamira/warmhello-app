import { CheckInCard } from "@/components/check-in-card";
import { getCheckInPageData } from "@/lib/checkins";

type CheckInPageProps = {
  params: Promise<{ token: string }>;
};

export default async function CheckInPage({ params }: CheckInPageProps) {
  const { token } = await params;
  const data = await getCheckInPageData(token);

  return (
    <main className="shell">
      <CheckInCard {...data} />
    </main>
  );
}
