"use client";
import { useState, useEffect } from "react";
import { db } from "@/lib/data/db";
import type { Pickup, DropoffSite, FoodCategory } from "@/lib/data/types";
import { DEMO_BUSINESS_ID, DEMO_BUSINESS_NAME } from "@/lib/data/types";
import { useStoreVersion } from "@/components/useStoreVersion";
import { useToast } from "@/components/Toast";
import { StatusBadge, CategoryChip, Field, inputCls } from "./ui";

const CATEGORIES: FoodCategory[] = ["Prepared", "Produce", "Bakery", "Dairy", "Packaged"];

export default function BusinessDashboard() {
  const version = useStoreVersion();
  const toast = useToast();
  const [pickups, setPickups] = useState<Pickup[]>([]);
  const [sites, setSites] = useState<DropoffSite[]>([]);

  const [food, setFood] = useState("");
  const [category, setCategory] = useState<FoodCategory>("Prepared");
  const [quantity, setQuantity] = useState("");
  const [window_, setWindow] = useState("");
  const [address, setAddress] = useState("");
  const [dropoffSiteId, setDropoffSiteId] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    db.listDropoffSites().then(s => { setSites(s); if (s.length) setDropoffSiteId(s[0].id); });
  }, []);

  useEffect(() => {
    db.listBusinessPickups(DEMO_BUSINESS_ID).then(setPickups);
  }, [version]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!food || !quantity || !window_ || !address || !dropoffSiteId) return;
    setSubmitting(true);
    try {
      await db.createPickup({
        businessId: DEMO_BUSINESS_ID,
        businessName: DEMO_BUSINESS_NAME,
        food, category, quantity,
        pickupWindow: window_,
        pickupAddress: address,
        dropoffSiteId,
        notes,
      });
      toast("Posted — students can claim it now.");
      setFood(""); setQuantity(""); setWindow(""); setAddress(""); setNotes("");
    } finally {
      setSubmitting(false);
    }
  }

  async function cancel(id: string) {
    await db.cancelPickup(id);
    toast("Pickup cancelled.");
  }

  return (
    <div className="space-y-8">
      {/* Post form */}
      <div className="bg-white border border-line rounded-2xl p-6">
        <h2 className="font-display text-xl text-ink mb-5">Post surplus food</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="What food?">
            <input className={inputCls} value={food} onChange={e => setFood(e.target.value)} placeholder="e.g. Sandwiches & salads" required />
          </Field>
          <Field label="Category">
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map(c => (
                <CategoryChip key={c} label={c} selected={category === c} onClick={() => setCategory(c)} />
              ))}
            </div>
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Approx. quantity">
              <input className={inputCls} value={quantity} onChange={e => setQuantity(e.target.value)} placeholder="e.g. ~15 meals" required />
            </Field>
            <Field label="Pickup window">
              <input className={inputCls} value={window_} onChange={e => setWindow(e.target.value)} placeholder="e.g. Today 4–6 pm" required />
            </Field>
          </div>
          <Field label="Pickup address">
            <input className={inputCls} value={address} onChange={e => setAddress(e.target.value)} placeholder="Street address" required />
          </Field>
          <Field label="Send food to">
            <select className={inputCls} value={dropoffSiteId} onChange={e => setDropoffSiteId(e.target.value)}>
              {sites.map(s => <option key={s.id} value={s.id}>{s.name} — {s.city}</option>)}
            </select>
          </Field>
          <Field label="Notes (optional)">
            <textarea className={inputCls} value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Allergens, temperature notes, etc." />
          </Field>
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-leaf text-cream py-2.5 rounded-lg font-semibold hover:bg-leaf-600 transition-colors disabled:opacity-50"
          >
            {submitting ? "Posting…" : "Post pickup →"}
          </button>
        </form>
      </div>

      {/* Pickup list */}
      <div>
        <h3 className="font-semibold text-ink mb-3">Your pickups</h3>
        {pickups.length === 0 && (
          <p className="text-muted text-sm">No pickups yet. Post one above.</p>
        )}
        <div className="space-y-3">
          {pickups.map(p => (
            <div key={p.id} className="bg-white border border-line rounded-xl p-4 flex justify-between items-start gap-4">
              <div className="space-y-1 flex-1">
                <div className="font-semibold text-ink text-sm">{p.food}</div>
                <div className="text-muted text-xs">{p.quantity} · {p.pickupWindow}</div>
                <div className="text-muted text-xs">→ {sites.find(s => s.id === p.dropoffSiteId)?.name ?? p.dropoffSiteId}</div>
                {p.studentName && <div className="text-xs text-leaf font-medium">Driver: {p.studentName}</div>}
              </div>
              <div className="flex flex-col items-end gap-2">
                <StatusBadge status={p.status} />
                {p.status === "open" && (
                  <button onClick={() => cancel(p.id)} className="text-xs text-muted hover:text-red-600 transition-colors">Cancel</button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
