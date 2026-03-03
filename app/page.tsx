"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";

const TOTAL_TILES = 72; // matches CSS grid: 4×18 = 8×9 = 12×6
const REVEAL_INTERVAL_MS = 50;
const TILE_TRANSITION_MS = 200;
const HOLD_ON_WALL_MS = 1800;
const FADE_OUT_MS = 700;

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
  const [isFading, setIsFading] = useState(false);
  // null = not yet mounted (SSR), number = ready to animate
  const [tilesPerTick, setTilesPerTick] = useState<number | null>(null);

  const revealOrder = useMemo(
    () => shuffleArray(Array.from({ length: TOTAL_TILES }, (_, i) => i)),
    []
  );

  // O(1) map: tile index → its position in the reveal sequence
  const revealIndexMap = useMemo(() => {
    const map = new Array(TOTAL_TILES);
    revealOrder.forEach((tileIndex, order) => {
      map[tileIndex] = order;
    });
    return map;
  }, [revealOrder]);

  useEffect(() => {
    // Reveal more tiles per tick on mobile → fewer animation groups → smoother
    const tpt = window.innerWidth < 640 ? 3 : 1;
    setTilesPerTick(tpt);

    // Total time for all tiles to finish animating
    const totalAnimationMs =
      Math.ceil(TOTAL_TILES / tpt) * REVEAL_INTERVAL_MS + TILE_TRANSITION_MS;

    const holdTimer = setTimeout(
      () => setIsFading(true),
      totalAnimationMs + HOLD_ON_WALL_MS
    );
    const navTimer = setTimeout(
      () => router.push("/quote"),
      totalAnimationMs + HOLD_ON_WALL_MS + FADE_OUT_MS
    );

    return () => {
      clearTimeout(holdTimer);
      clearTimeout(navTimer);
    };
  }, [router]);

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
      {/* grid mask overlay — pure CSS animations, zero JS during playback */}
      <div className="wall-grid-full absolute inset-0">
        {Array.from({ length: TOTAL_TILES }, (_, i) => {
          if (tilesPerTick === null) {
            // Pre-mount: tiles are solid (wall hidden). No animation yet.
            return <div key={i} style={{ backgroundColor: "#fbf7ef" }} />;
          }

          // Each tile gets a pre-computed CSS animation delay.
          // Tiles in the same "tick group" animate simultaneously.
          const tickIndex = Math.floor(revealIndexMap[i] / tilesPerTick);
          const delayMs = tickIndex * REVEAL_INTERVAL_MS;

          return (
            <div
              key={i}
              style={{
                backgroundColor: "#fbf7ef",
                animation: `tileReveal ${TILE_TRANSITION_MS}ms ease-out ${delayMs}ms forwards`,
              }}
            />
          );
        })}
      </div>
    </main>
  );
}
