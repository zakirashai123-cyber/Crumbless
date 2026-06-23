import type { PickupStatus } from "@/lib/data/types";

export function StatusBadge({ status }: { status: PickupStatus }) {
  const map: Record<PickupStatus, string> = {
    open: "bg-sprout-soft text-forest",
    claimed: "bg-honey/20 text-amber-800",
    in_transit: "bg-blue-100 text-blue-800",
    delivered: "bg-forest text-cream",
    cancelled: "bg-line text-muted",
  };
  const label: Record<PickupStatus, string> = {
    open: "Open",
    claimed: "Claimed",
    in_transit: "In transit",
    delivered: "Delivered",
    cancelled: "Cancelled",
  };
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${map[status]}`}>
      {label[status]}
    </span>
  );
}

export function CategoryChip({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
        selected
          ? "bg-sprout-soft border-leaf text-forest"
          : "bg-cream border-line text-muted hover:border-leaf"
      }`}
    >
      {label}
    </button>
  );
}

export function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-semibold uppercase tracking-widest text-muted">
        {label}
      </label>
      {children}
    </div>
  );
}

export const inputCls =
  "w-full border border-line rounded-lg px-3 py-2 text-sm bg-cream focus:outline-none focus:ring-2 focus:ring-leaf/30 focus:border-leaf transition-colors";
