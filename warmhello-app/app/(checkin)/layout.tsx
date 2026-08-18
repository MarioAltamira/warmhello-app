import { FloatingReturnButton } from "@/components/floating-return-button";

export default function CheckInLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <FloatingReturnButton />
    </>
  );
}
