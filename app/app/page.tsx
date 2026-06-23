import CoreLoop from "@/components/app/CoreLoop";
import Link from "next/link";

export default function AppPage({
  searchParams,
}: {
  searchParams: { role?: string };
}) {
  const role = searchParams.role === "student" ? "student" : "business";

  return (
    <div className="min-h-screen bg-cream">
      <div className="max-w-5xl mx-auto px-5 py-8">
        <div className="flex items-center justify-between mb-8">
          <Link href="/" className="font-display text-ink text-lg font-semibold">Crumbless</Link>
          <span className="text-muted text-sm">Demo mode · in-memory data</span>
        </div>
        <CoreLoop defaultRole={role} />
      </div>
    </div>
  );
}
