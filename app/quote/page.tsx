"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const QUOTE = "thoughts are like tiles. each one fits somewhere. together, they make a wall.";

function getTypingDelay(char: string, prevChar: string): number {
  const baseMin = 45;
  const baseMax = 95;
  const base = Math.floor(Math.random() * (baseMax - baseMin + 1)) + baseMin;
  if (char === " " || char === "." || char === ",") return base + 30 + Math.random() * 50;
  if (prevChar === "." || prevChar === " ") return base + 15 + Math.random() * 35;
  return base;
}

export default function QuotePage() {
  const router = useRouter();
  const [typedLength, setTypedLength] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);

  const displayedQuote = reducedMotion ? QUOTE : QUOTE.slice(0, typedLength);
  const typingComplete = typedLength >= QUOTE.length;

  useEffect(() => {
    if (!typingComplete) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        router.push("/tiles");
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [typingComplete, router]);

  const handleClick = () => {
    if (typingComplete) router.push("/tiles");
  };

  useEffect(() => {
    setReducedMotion(typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  useEffect(() => {
    if (typedLength >= QUOTE.length) return;
    if (reducedMotion) {
      setTypedLength(QUOTE.length);
      return;
    }
    const char = QUOTE[typedLength];
    const prevChar = typedLength > 0 ? QUOTE[typedLength - 1] : "";
    const delay = getTypingDelay(char, prevChar);
    const id = setTimeout(() => setTypedLength((n) => n + 1), delay);
    return () => clearTimeout(id);
  }, [typedLength, reducedMotion]);

  return (
    <main
      className="flex min-h-screen flex-col items-center justify-center bg-[#fbf7ef] px-8 py-24 cursor-default"
      onClick={handleClick}
      role="button"
      tabIndex={0}
      aria-label={typingComplete ? "Tap or press Enter or Space to continue" : undefined}
    >
      <div className="max-w-xl mx-auto space-y-12 text-center">
        <p className="text-2xl sm:text-3xl leading-relaxed text-black lowercase tracking-wide" style={{ letterSpacing: "0.08em" }}>
          {displayedQuote}
          <span
            className="cursor-blink ml-0.5 inline-block w-[2px] flex-shrink-0 bg-black"
            style={{ height: "1.2em", verticalAlign: "text-bottom" }}
            aria-hidden
          />
        </p>
      </div>
    </main>
  );
}
