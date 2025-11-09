import { Suspense } from "react";
import ClientSearch from "@/components/reset-password";

export default function Page({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  return (
    <Suspense fallback={<>...</>}>
      <ClientSearch searchParams={searchParams} />
    </Suspense>
  );
}
