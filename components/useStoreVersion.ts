"use client";
import { useEffect, useState } from "react";
import { subscribe, getVersion } from "@/lib/data/memory";

export function useStoreVersion() {
  const [v, setV] = useState(() => getVersion());
  useEffect(() => {
    const unsubscribe = subscribe(() => setV(getVersion()));
    return () => { unsubscribe(); };   // cleanup must return void, not Set.delete's boolean
  }, []);
  return v;
}
