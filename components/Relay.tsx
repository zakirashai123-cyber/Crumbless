"use client";
import { useEffect, useRef, useState } from "react";

const STEPS = [
  { label: "Business posts surplus food", sub: "Any category — prepared meals, produce, bakery, more" },
  { label: "Student claims the route", sub: "Each trip is worth verified service hours" },
  { label: "Pick up at the business", sub: "Student arrives during the pickup window" },
  { label: "Drive to the shelter", sub: "Howard County Food Bank, Nourish Now, and others" },
  { label: "Hours logged automatically", sub: "Export a verified summary for school or college apps" },
];

export default function Relay() {
  const trackRef = useRef<HTMLDivElement>(null);
  const [fill, setFill] = useState(0);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mq.matches) { setFill(100); return; }

    const onScroll = () => {
      const el = trackRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const progress = Math.max(0, Math.min(1, (vh - rect.top) / (rect.height + vh * 0.3)));
      setFill(progress * 100);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="flex gap-10 max-w-2xl mx-auto" ref={trackRef}>
      {/* Track */}
      <div className="relative flex-shrink-0 w-6 flex flex-col items-center">
        <div className="absolute inset-0 w-0.5 mx-auto bg-line rounded-full" />
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-0.5 rounded-full transition-none"
          style={{
            height: `${fill}%`,
            background: "linear-gradient(to bottom, #1E8E4E, #6FE08A)",
          }}
        />
        {STEPS.map((_, i) => {
          const dotFill = fill >= (i / (STEPS.length - 1)) * 100 - 5;
          return (
            <div
              key={i}
              className="relative z-10 w-5 h-5 rounded-full border-2 flex items-center justify-center text-[10px] font-mono font-bold transition-colors duration-300"
              style={{
                marginTop: i === 0 ? 0 : "calc(20% - 10px)",
                borderColor: dotFill ? "#1E8E4E" : "#E3EEE3",
                background: dotFill ? "#1E8E4E" : "#FBFDF8",
                color: dotFill ? "#FBFDF8" : "#5E7065",
                top: i === 0 ? 0 : undefined,
                position: i === 0 ? "relative" : "absolute",
                left: "50%",
                transform: i === 0 ? "translateX(-50%)" : "translateX(-50%)",
              }}
            >
              {i + 1}
            </div>
          );
        })}
      </div>

      {/* Steps */}
      <div className="flex flex-col gap-12 py-1 flex-1">
        {STEPS.map((step, i) => (
          <div key={i}>
            <div className="font-semibold text-ink text-base">{step.label}</div>
            <div className="text-muted text-sm mt-0.5">{step.sub}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
