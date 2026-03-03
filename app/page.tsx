"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";

const GRID_COLS = 12;
const GRID_ROWS = 6;
const TOTAL_TILES = GRID_COLS * GRID_ROWS;
const REVEAL_INTERVAL_MS = 50;
const HOLD_ON_WALL_MS = 1800;
const FADE_OUT_MS = 700;
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
  const tilesPerTick = useRef(1);

  const revealOrder = useMemo(
    () => shuffleArray(Array.from({ length: TOTAL_TILES }, (_, i) => i)),
    []
  );

  // O(1) lookup: for each tile index, store what order it gets revealed
  // replaces the slow O(n) indexOf call that was running 72× per render
  const revealIndexMap = useMemo(() => {
    const map = new Array(TOTAL_TILES);
    revealOrder.forEach((tileIndex, order) => {
      map[tileIndex] = order;
    });
    return map;
  }, [revealOrder]);

  useEffect(() => {
    // reveal more tiles per tick on mobile to keep animation smooth & quick
    tilesPerTick.current = window.innerWidth < 640 ? 3 : 1;
  }, []);

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
      setRevealedCount((prev) => Math.min(prev + tilesPerTick.current, TOTAL_TILES));
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
      {/* wallpaper background */}
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
          const isRevealed = revealIndexMap[i] < revealedCount; // O(1)
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
