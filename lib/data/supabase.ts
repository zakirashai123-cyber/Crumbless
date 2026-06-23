import type { DB } from "./types";

// Stub — fill in queries after running supabase/schema.sql and setting env vars.
export const supabaseDb: DB = {
  listDropoffSites: async () => { throw new Error("Supabase not implemented"); },
  listOpenPickups: async () => { throw new Error("Supabase not implemented"); },
  listBusinessPickups: async () => { throw new Error("Supabase not implemented"); },
  createPickup: async () => { throw new Error("Supabase not implemented"); },
  cancelPickup: async () => { throw new Error("Supabase not implemented"); },
  claimPickup: async () => { throw new Error("Supabase not implemented"); },
  markPickedUp: async () => { throw new Error("Supabase not implemented"); },
  markDelivered: async () => { throw new Error("Supabase not implemented"); },
  getStudentHours: async () => { throw new Error("Supabase not implemented"); },
};
