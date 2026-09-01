import { Suspense } from "react";
import ForgotFormInner from "./forgot-form-inner";

export default function ForgotPage() {
  return (
    <Suspense
      fallback={
        <main className="shell">
          <section className="card auth-hero">
            <p className="eyebrow">Loading...</p>
            <h1>Preparing your secure log-in link request...</h1>
          </section>
        </main>
      }
    >
      <ForgotFormInner />
    </Suspense>
  );
}
