"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const LINE_1 = "thoughts are like tiles. each one fits somewhere.";
const LINE_2 = "together, they make a wall.";
const FULL_TEXT = LINE_1 + "\n" + LINE_2;

function getTypingDelay(prevChar: string, nextIndex: number): number {
  let base: number;
  if (prevChar === "\n") base = 560;
  else if (prevChar === ".") base = 370 + Math.random() * 160;
  else if (prevChar === ",") base = 210 + Math.random() * 100;
  else if (nextIndex < 4) base = 55 + Math.random() * 55;
  else {
    const line2Start = LINE_1.length + 1;
    if (nextIndex >= line2Start && nextIndex < line2Start + 4) base = 55 + Math.random() * 55;
    else base = 32 + Math.random() * 52;
  }
  const progressionVariation = ((nextIndex % 6) - 2) * 15;
  const hesitation = Math.random() < 0.05 ? 120 : 0;
  return Math.max(20, base + progressionVariation + hesitation);
}

export default function QuotePage() {
  const router = useRouter();
  const [typedLength, setTypedLength] = useState(0);
  const isComplete = typedLength >= FULL_TEXT.length;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        router.push("/tiles");
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [router]);

  useEffect(() => {
    if (typedLength >= FULL_TEXT.length) return;
    const prevChar = typedLength > 0 ? FULL_TEXT[typedLength - 1] : "";
    const delay = getTypingDelay(prevChar, typedLength);
    const id = setTimeout(() => setTypedLength((n) => n + 1), delay);
    return () => clearTimeout(id);
  }, [typedLength]);

  const displayed = FULL_TEXT.slice(0, typedLength);
  const hasNewline = displayed.includes("\n");
  const parts = displayed.split("\n");
  const line1 = parts[0] ?? "";
  const line2 = parts[1] ?? "";

  const lineStyle = "text-lg sm:text-2xl leading-relaxed text-black lowercase tracking-wide";
  const letterSpacing = { letterSpacing: "0.08em" as const };

  return (
    <main
      className="flex min-h-screen flex-col items-center justify-center bg-[#fbf7ef] px-8 py-24 cursor-default"
      onClick={() => router.push("/tiles")}
      role="button"
      tabIndex={0}
      aria-label="Tap or press Enter or Space to continue"
    >
      <div className="flex flex-col items-center gap-10 sm:gap-2 text-center max-w-[92vw] sm:max-w-none px-4 sm:px-0 break-anywhere">
        <p
          className={`${lineStyle} whitespace-normal sm:whitespace-nowrap`}
          style={letterSpacing}
        >
          {line1}
          {!hasNewline && (
            <span
              className="cursor-blink ml-0.5 inline-block w-[2px] flex-shrink-0 bg-black align-middle"
              style={{ height: "1em", verticalAlign: "text-bottom" }}
              aria-hidden
            />
          )}
        </p>
        {hasNewline && (
          <p className={lineStyle} style={letterSpacing}>
            {line2}
            <span
              className="cursor-blink ml-0.5 inline-block w-[2px] flex-shrink-0 bg-black align-middle"
              style={{ height: "1em", verticalAlign: "text-bottom" }}
              aria-hidden
            />
          </p>
        )}
      </div>
    </main>
  );
}
