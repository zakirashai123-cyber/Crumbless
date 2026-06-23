import { memoryDb } from "./memory";
import { supabaseDb } from "./supabase";

export const db = process.env.NEXT_PUBLIC_SUPABASE_URL ? supabaseDb : memoryDb;
