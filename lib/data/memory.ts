import type {
  DB, DropoffSite, Pickup, NewPickup, HoursEntry,
} from "./types";
import { HOURS_PER_TRIP, DEMO_BUSINESS_ID, DEMO_BUSINESS_NAME } from "./types";

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

interface Store {
  dropoffSites: DropoffSite[];
  pickups: Pickup[];
  hoursHistory: HoursEntry[];
  version: number;
  listeners: Set<() => void>;
}

declare const globalThis: { __crumbless_store?: Store };

function getStore(): Store {
  if (!globalThis.__crumbless_store) {
    globalThis.__crumbless_store = makeStore();
  }
  return globalThis.__crumbless_store;
}

function makeStore(): Store {
  const dropoffSites: DropoffSite[] = [
    { id: "site-1", name: "Howard County Food Bank", city: "Ellicott City", address: "9385 Gerwig Ln, Columbia, MD 21046", active: true },
    { id: "site-2", name: "Maryland Food Bank — Howard County", city: "Columbia", address: "2200 Broening Hwy, Baltimore, MD 21224", active: true },
    { id: "site-3", name: "Nourish Now", city: "Rockville", address: "15910 Chieftain Ave, Rockville, MD 20855", active: true },
  ];

  const pickups: Pickup[] = [
    {
      id: uid(),
      businessId: DEMO_BUSINESS_ID,
      businessName: "Folly Quarter Café",
      food: "Sandwiches & salads",
      category: "Prepared",
      quantity: "~15 meals",
      pickupWindow: "Today 4–6 pm",
      pickupAddress: "9400 Frederick Rd, Ellicott City, MD 21042",
      dropoffSiteId: "site-1",
      status: "open",
      hoursCredit: HOURS_PER_TRIP,
      createdAt: new Date().toISOString(),
      distanceMiles: 2.3,
    },
    {
      id: uid(),
      businessId: DEMO_BUSINESS_ID,
      businessName: "Green Valley Grocers",
      food: "Bread & pastries",
      category: "Bakery",
      quantity: "3 boxes",
      pickupWindow: "Today 5–7 pm",
      pickupAddress: "10300 Little Patuxent Pkwy, Columbia, MD 21044",
      dropoffSiteId: "site-2",
      status: "open",
      hoursCredit: HOURS_PER_TRIP,
      createdAt: new Date().toISOString(),
      distanceMiles: 3.8,
    },
  ];

  return { dropoffSites, pickups, hoursHistory: [], version: 0, listeners: new Set() };
}

function notify() {
  const s = getStore();
  s.version++;
  s.listeners.forEach(fn => fn());
}

export function subscribe(fn: () => void) {
  getStore().listeners.add(fn);
  return () => getStore().listeners.delete(fn);
}

export function getVersion() {
  return getStore().version;
}

export const memoryDb: DB = {
  async listDropoffSites() {
    return getStore().dropoffSites.filter(s => s.active);
  },

  async listOpenPickups() {
    return getStore().pickups.filter(p => p.status === "open");
  },

  async listBusinessPickups(businessId) {
    return getStore().pickups.filter(p => p.businessId === businessId);
  },

  async createPickup(input: NewPickup) {
    const pickup: Pickup = {
      ...input,
      id: uid(),
      status: "open",
      hoursCredit: HOURS_PER_TRIP,
      createdAt: new Date().toISOString(),
      distanceMiles: parseFloat((Math.random() * 5 + 1).toFixed(1)),
    };
    getStore().pickups.push(pickup);
    notify();
    return pickup;
  },

  async cancelPickup(id) {
    const s = getStore();
    const p = s.pickups.find(x => x.id === id);
    if (p && p.status === "open") { p.status = "cancelled"; notify(); }
  },

  async claimPickup(id, studentId) {
    const s = getStore();
    const p = s.pickups.find(x => x.id === id);
    if (!p || p.status !== "open") throw new Error("Pickup not available");
    p.status = "claimed";
    p.studentId = studentId;
    p.studentName = "Zakir";
    notify();
    return p;
  },

  async markPickedUp(id) {
    const s = getStore();
    const p = s.pickups.find(x => x.id === id);
    if (!p || p.status !== "claimed") throw new Error("Cannot mark picked up");
    p.status = "in_transit";
    notify();
    return p;
  },

  async markDelivered(id) {
    const s = getStore();
    const p = s.pickups.find(x => x.id === id);
    if (!p || p.status !== "in_transit") throw new Error("Cannot mark delivered");
    p.status = "delivered";
    const site = s.dropoffSites.find(x => x.id === p.dropoffSiteId);
    s.hoursHistory.push({
      id: uid(),
      pickupId: p.id,
      food: p.food,
      businessName: p.businessName,
      dropoffSiteName: site?.name ?? "Shelter",
      deliveredAt: new Date().toISOString(),
      hours: p.hoursCredit,
    });
    notify();
    return p;
  },

  async getStudentHours(studentId) {
    const history = getStore().hoursHistory;
    const total = history.reduce((sum, e) => sum + e.hours, 0);
    return { total, history: [...history].reverse() };
  },
};
