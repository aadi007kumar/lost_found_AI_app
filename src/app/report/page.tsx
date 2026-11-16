import { Suspense } from "react";
import { connection } from "next/server";
import { ReportForm } from "@/components/ReportForm";
import { istToday } from "@/lib/format";

async function FormWithToday() {
  await connection(); // "today" must be computed per request
  return <ReportForm today={istToday()} />;
}

export default function ReportPage() {
  return (
    <div className="mx-auto max-w-2xl py-10 sm:py-14">
      <h1 className="font-serif text-3xl tracking-tight sm:text-4xl">Post a report</h1>
      <p className="mt-2 text-muted">
        Takes about a minute. We’ll show likely matches right after you post.
      </p>
      <div className="mt-8">
        <Suspense fallback={<div className="h-[900px] animate-pulse rounded-2xl bg-soft" />}>
          <FormWithToday />
        </Suspense>
      </div>
    </div>
  );
}
