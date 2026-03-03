"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const LINE_1 = "thoughts are like tiles. each one fits somewhere.";
const LINE_2 = "together, they make a wall.";
const FULL_TEXT = LINE_1 + "\n" + LINE_2;

function getTypingDelay(prevChar: string, nextIndex: number): number {
  let base: number;
  // Extra pause after finishing line 1 before starting line 2
  if (prevChar === "\n") base = 800;
  // Longer pause after punctuation
  else if (prevChar === ".") base = 520 + Math.random() * 230;
  else if (prevChar === ",") base = 300 + Math.random() * 150;
  // Slightly slower at the beginning of each line (first 4 chars)
  else if (nextIndex < 4) base = 75 + Math.random() * 75;
  else {
    const line2Start = LINE_1.length + 1;
    if (nextIndex >= line2Start && nextIndex < line2Start + 4) base = 75 + Math.random() * 75;
    else base = 45 + Math.random() * 75; // Delay between characters (45–120ms)
  }
  // Slightly vary speed as the sentence progresses (gentle wave)
  const progressionVariation = ((nextIndex % 6) - 2) * 22;
  // Occasionally insert a hesitation (5% chance per character)
  const hesitation = Math.random() < 0.05 ? 180 : 0;
  return Math.max(30, base + progressionVariation + hesitation);
}

export default function QuotePage() {
  const router = useRouter();
  const [typedLength, setTypedLength] = useState(0);
  const isComplete = typedLength >= FULL_TEXT.length;

  useEffect(() => {
    if (!isComplete) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        router.push("/tiles");
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isComplete, router]);

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
      onClick={() => isComplete && router.push("/tiles")}
      role="button"
      tabIndex={0}
      aria-label={isComplete ? "Tap or press Enter or Space to continue" : undefined}
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
