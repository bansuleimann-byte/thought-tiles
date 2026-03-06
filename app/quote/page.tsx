"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const LINE_1 = "thoughts are like tiles. each one fits somewhere.";
const LINE_2 = "together, they make a wall.";

// Pre-compute per-character CSS animation delays once at module load
function buildCharData() {
  const chars: Array<{ char: string; line: 1 | 2; delay: number }> = [];
  let t = 0;

  for (let i = 0; i < LINE_1.length; i++) {
    chars.push({ char: LINE_1[i], line: 1, delay: t });
    const ch = LINE_1[i];
    if (ch === ".") t += 320;
    else if (ch === ",") t += 160;
    else if (i < 4) t += 55;
    else t += 40;
  }

  t += 450; // pause between lines

  for (let i = 0; i < LINE_2.length; i++) {
    chars.push({ char: LINE_2[i], line: 2, delay: t });
    const ch = LINE_2[i];
    if (ch === ".") t += 320;
    else if (ch === ",") t += 160;
    else if (i < 4) t += 55;
    else t += 40;
  }

  return chars;
}

const CHAR_DATA = buildCharData();
const LINE_2_START_MS = CHAR_DATA.find((c) => c.line === 2)!.delay;
const TOTAL_MS = CHAR_DATA[CHAR_DATA.length - 1].delay + 80;

const line1Chars = CHAR_DATA.filter((c) => c.line === 1);
const line2Chars = CHAR_DATA.filter((c) => c.line === 2);

const lineStyle =
  "text-lg sm:text-2xl leading-relaxed text-black lowercase tracking-wide";
const letterSpacing = { letterSpacing: "0.08em" as const };

export default function QuotePage() {
  const router = useRouter();
  const [cursorLine, setCursorLine] = useState<1 | 2>(1);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setCursorLine(2), LINE_2_START_MS);
    const t2 = setTimeout(() => setIsComplete(true), TOTAL_MS);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

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
          {line1Chars.map(({ char, delay }, i) => (
            <span key={i} className="char-reveal" style={{ animationDelay: `${delay}ms` }}>
              {char}
            </span>
          ))}
          {cursorLine === 1 && (
            <span
              className="cursor-blink ml-0.5 inline-block w-[2px] flex-shrink-0 bg-black align-middle"
              style={{ height: "1em", verticalAlign: "text-bottom" }}
              aria-hidden
            />
          )}
        </p>
        <p className={lineStyle} style={letterSpacing}>
          {line2Chars.map(({ char, delay }, i) => (
            <span key={i} className="char-reveal" style={{ animationDelay: `${delay}ms` }}>
              {char}
            </span>
          ))}
          {cursorLine === 2 && (
            <span
              className="cursor-blink ml-0.5 inline-block w-[2px] flex-shrink-0 bg-black align-middle"
              style={{ height: "1em", verticalAlign: "text-bottom" }}
              aria-hidden
            />
          )}
        </p>
      </div>
    </main>
  );
}
