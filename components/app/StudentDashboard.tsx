"use client";
import { useState, useEffect } from "react";
import { db } from "@/lib/data/db";
import type { Pickup, DropoffSite, HoursEntry } from "@/lib/data/types";
import { DEMO_STUDENT_ID, DEMO_STUDENT_NAME } from "@/lib/data/types";
import { useStoreVersion } from "@/components/useStoreVersion";
import { useToast } from "@/components/Toast";
import { StatusBadge, CategoryChip } from "./ui";

export default function StudentDashboard() {
  const version = useStoreVersion();
  const toast = useToast();
  const [openPickups, setOpenPickups] = useState<Pickup[]>([]);
  const [sites, setSites] = useState<DropoffSite[]>([]);
  const [activePickup, setActivePickup] = useState<Pickup | null>(null);
  const [hours, setHours] = useState(0);
  const [history, setHistory] = useState<HoursEntry[]>([]);

  useEffect(() => {
    db.listDropoffSites().then(setSites);
  }, []);

  useEffect(() => {
    db.listOpenPickups().then(setOpenPickups);
    db.getStudentHours(DEMO_STUDENT_ID).then(r => { setHours(r.total); setHistory(r.history); });
  }, [version]);

  // Track active pickup
  useEffect(() => {
    async function findActive() {
      // Check all pickups claimed/in_transit by this student
      // We do this by scanning open → they won't be open if claimed
      // For demo: scan all visible via memory
      // Simplification: re-use a combined fetch via memory internals.
      // Instead, keep a local cache of our claimed pickup id.
    }
  }, [version]);

  async function claim(pickup: Pickup) {
    try {
      const updated = await db.claimPickup(pickup.id, DEMO_STUDENT_ID);
      setActivePickup(updated);
      toast(`${DEMO_STUDENT_NAME} claimed a pickup. The business was notified.`);
    } catch {
      toast("Someone else just claimed that one — pick another.");
    }
  }

  async function markPickedUp() {
    if (!activePickup) return;
    const updated = await db.markPickedUp(activePickup.id);
    setActivePickup(updated);
    toast("Picked up — food is in transit.");
  }

  async function markDelivered() {
    if (!activePickup) return;
    const updated = await db.markDelivered(activePickup.id);
    toast(`Delivered! +${updated.hoursCredit} verified hours logged.`);
    setActivePickup(null);
  }

  function exportHours() {
    const lines = [
      "CRUMBLESS — VERIFIED SERVICE HOURS SUMMARY",
      `Student: ${DEMO_STUDENT_NAME}`,
      `Exported: ${new Date().toLocaleDateString("en-US", { dateStyle: "long" })}`,
      "",
      `Total verified hours: ${hours.toFixed(1)} hrs`,
      "",
      "Delivery history:",
      ...history.map(
        e =>
          `  ${new Date(e.deliveredAt).toLocaleDateString()} | ${e.food} from ${e.businessName} → ${e.dropoffSiteName} | ${e.hours} hrs`
      ),
      "",
      "Verified by Crumbless — Maryland food rescue, driven by students.",
      "crumbless.app",
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "crumbless-hours.txt"; a.click();
    URL.revokeObjectURL(url);
  }

  const siteName = (id: string) => sites.find(s => s.id === id)?.name ?? id;

  return (
    <div className="space-y-8">
      {/* Active pickup */}
      {activePickup && (
        <div className="bg-ink text-cream rounded-2xl p-6">
          <div className="text-xs font-semibold uppercase tracking-widest text-sprout mb-3">Active pickup</div>
          <div className="font-display text-xl mb-1">{activePickup.food}</div>
          <div className="text-cream/70 text-sm mb-4">{activePickup.businessName} · {activePickup.pickupWindow}</div>
          <div className="grid grid-cols-2 gap-3 text-sm mb-5">
            <div>
              <div className="text-cream/50 text-xs mb-0.5">Pick up at</div>
              <div>{activePickup.pickupAddress}</div>
            </div>
            <div>
              <div className="text-cream/50 text-xs mb-0.5">Drop off at</div>
              <div>{siteName(activePickup.dropoffSiteId)}</div>
            </div>
          </div>
          <div className="text-cream/50 text-xs mb-4">
            Worth <span className="font-mono text-sprout">{activePickup.hoursCredit} hrs</span> of verified service
          </div>
          {activePickup.status === "claimed" && (
            <button onClick={markPickedUp} className="w-full bg-leaf text-cream py-2.5 rounded-lg font-semibold hover:bg-leaf-600 transition-colors">
              Mark picked up
            </button>
          )}
          {activePickup.status === "in_transit" && (
            <button onClick={markDelivered} className="w-full bg-sprout text-forest py-2.5 rounded-lg font-semibold hover:bg-sprout/80 transition-colors">
              Mark delivered ✓
            </button>
          )}
        </div>
      )}

      {/* Open pickups */}
      {!activePickup && (
        <div>
          <h3 className="font-semibold text-ink mb-3">Open pickups near you</h3>
          {openPickups.length === 0 && (
            <p className="text-muted text-sm">No open pickups right now. Check back soon.</p>
          )}
          <div className="space-y-3">
            {openPickups.map(p => (
              <div key={p.id} className="bg-white border border-line rounded-xl p-4">
                <div className="flex justify-between items-start gap-3 mb-3">
                  <div>
                    <div className="font-semibold text-ink text-sm">{p.food}</div>
                    <div className="text-muted text-xs mt-0.5">{p.businessName}</div>
                  </div>
                  <CategoryChip label={p.category} selected={false} />
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted mb-3">
                  <span>{p.quantity}</span>
                  <span>{p.pickupWindow}</span>
                  <span>→ {siteName(p.dropoffSiteId)}</span>
                  <span>{p.distanceMiles} mi away</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-leaf font-semibold">+{p.hoursCredit} hrs verified</span>
                  <button
                    onClick={() => claim(p)}
                    className="bg-leaf text-cream px-4 py-1.5 rounded-lg text-sm font-semibold hover:bg-leaf-600 transition-colors"
                  >
                    Claim
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Hours */}
      <div className="bg-cream-100 border border-line rounded-2xl p-6">
        <div className="text-xs font-semibold uppercase tracking-widest text-muted mb-2">Your verified hours</div>
        <div className="font-mono text-5xl font-semibold text-leaf mb-1">{hours.toFixed(1)}</div>
        <div className="text-muted text-sm mb-4">hrs of community service</div>

        {history.length > 0 && (
          <div className="space-y-2 mb-4">
            {history.map(e => (
              <div key={e.id} className="text-xs text-muted flex justify-between gap-3">
                <span className="truncate">{e.food} → {e.dropoffSiteName}</span>
                <span className="font-mono text-leaf flex-shrink-0">+{e.hours} hrs</span>
              </div>
            ))}
          </div>
        )}

        <button
          onClick={exportHours}
          className="w-full border border-leaf text-leaf py-2.5 rounded-lg font-semibold text-sm hover:bg-leaf hover:text-cream transition-colors"
        >
          Export summary for school →
        </button>
      </div>
    </div>
  );
}
