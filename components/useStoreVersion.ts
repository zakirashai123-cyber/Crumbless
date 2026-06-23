"use client";
import { useEffect, useState } from "react";
import { subscribe, getVersion } from "@/lib/data/memory";

export function useStoreVersion() {
  const [v, setV] = useState(() => getVersion());
  useEffect(() => subscribe(() => setV(getVersion())), []);
  return v;
}
