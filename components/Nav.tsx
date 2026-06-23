"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 40);
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(max > 0 ? (y / max) * 100 : 0);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 inset-x-0 z-40 transition-all duration-300 ${
        scrolled
          ? "bg-cream/90 backdrop-blur-md border-b border-line shadow-sm"
          : "bg-transparent"
      }`}
    >
      {/* Progress bar */}
      <div className="absolute top-0 inset-x-0 h-0.5 bg-line">
        <div
          className="h-full transition-none"
          style={{
            width: `${progress}%`,
            background: "linear-gradient(to right, #1E8E4E, #6FE08A)",
          }}
        />
      </div>

      <nav className="max-w-5xl mx-auto px-5 h-14 flex items-center justify-between">
        <Link href="/" className="font-display font-semibold text-ink text-lg tracking-tight">
          Crumbless
        </Link>
        <div className="hidden md:flex items-center gap-6 text-sm text-muted font-medium">
          <a href="#how">How it works</a>
          <a href="#who">Who it helps</a>
          <a href="#why">Why us</a>
          <a href="#demo">Live demo</a>
        </div>
        <Link
          href="/app?role=business"
          className="bg-leaf text-cream px-4 py-2 rounded-lg text-sm font-semibold hover:bg-leaf-600 transition-colors"
        >
          Try the demo
        </Link>
      </nav>
    </header>
  );
}
