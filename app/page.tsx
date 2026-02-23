"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";

const GRID_COLS = 12;
const GRID_ROWS = 6;
const TOTAL_TILES = GRID_COLS * GRID_ROWS;
const REVEAL_INTERVAL_MS = 50;
const HOLD_ON_WALL_MS = 1800;   /* time to show full assembled wall before fade */
const FADE_OUT_MS = 700;        /* fade duration */
const PAUSE_BEFORE_NAVIGATE_MS = HOLD_ON_WALL_MS + FADE_OUT_MS;

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export default function Home() {
  const router = useRouter();
  const [revealedCount, setRevealedCount] = useState(0);
  const [isFading, setIsFading] = useState(false);
  const isComplete = revealedCount >= TOTAL_TILES;

  const revealOrder = useMemo(
    () => shuffleArray(Array.from({ length: TOTAL_TILES }, (_, i) => i)),
    []
  );

  useEffect(() => {
    if (revealedCount >= TOTAL_TILES) {
      const holdTimer = setTimeout(() => setIsFading(true), HOLD_ON_WALL_MS);
      const navTimer = setTimeout(() => router.push("/quote"), PAUSE_BEFORE_NAVIGATE_MS);
      return () => {
        clearTimeout(holdTimer);
        clearTimeout(navTimer);
      };
    }

    const interval = setInterval(() => {
      setRevealedCount((prev) => prev + 1);
    }, REVEAL_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [revealedCount, router]);

  return (
    <main
      className={`fixed inset-0 select-none bg-[#fbf7ef] outline-none focus:outline-none transition-opacity ease-out ${
        isFading ? "opacity-0" : "opacity-100"
      }`}
    style={{ transitionDuration: isFading ? `${FADE_OUT_MS}ms` : undefined }}
    >
      {/* wallpaper background - tiled to fill viewport */}
      <div
        className="min-h-screen w-full bg-center bg-repeat"
        style={{
          backgroundImage: "url('/walls/wall1.jpg')",
          backgroundSize: "25%",
        }}
      />
      {/* grid mask overlay - reveals tiles randomly */}
      <div className="wall-grid-full absolute inset-0">
        {Array.from({ length: TOTAL_TILES }, (_, i) => {
          const revealIndex = revealOrder.indexOf(i);
          const isRevealed = revealIndex >= 0 && revealIndex < revealedCount;
          return (
            <div
              key={i}
              className={`transition-opacity duration-200 ease-out ${
                isRevealed ? "opacity-0" : "opacity-100"
              }`}
              style={{ backgroundColor: "#fbf7ef" }}
            />
          );
        })}
      </div>
    </main>
  );
}
