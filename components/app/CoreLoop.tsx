"use client";
import { useState } from "react";
import { ToastProvider } from "@/components/Toast";
import BusinessDashboard from "./BusinessDashboard";
import StudentDashboard from "./StudentDashboard";

type Role = "business" | "student";

export default function CoreLoop({ defaultRole }: { defaultRole?: Role }) {
  const [role, setRole] = useState<Role>(defaultRole ?? "business");

  return (
    <ToastProvider>
      <div className="max-w-lg mx-auto">
        {/* Role toggle */}
        <div className="flex bg-cream-100 border border-line rounded-xl p-1 mb-6">
          {(["business", "student"] as Role[]).map(r => (
            <button
              key={r}
              onClick={() => setRole(r)}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors capitalize ${
                role === r ? "bg-leaf text-cream shadow-sm" : "text-muted hover:text-ink"
              }`}
            >
              {r === "business" ? "🏪 Business" : "🚗 Student driver"}
            </button>
          ))}
        </div>

        {role === "business" ? <BusinessDashboard /> : <StudentDashboard />}
      </div>
    </ToastProvider>
  );
}
