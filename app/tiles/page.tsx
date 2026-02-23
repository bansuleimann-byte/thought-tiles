"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { thoughts } from "../thoughts";

const sortedThoughts = [...thoughts].sort((a, b) => {
  if (!a.date) return 1;
  if (!b.date) return -1;
  return new Date(b.date).getTime() - new Date(a.date).getTime();
});

const grainSvg = `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`;

const STAGGER_MS = 24;
const REVEAL_DURATION_MS = 420;
const REVEAL_EASING = "cubic-bezier(0.22, 1, 0.36, 1)";

export default function TilesPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <main className="fade-in relative min-h-screen select-none bg-[#fbf7ef] px-8 py-16 text-black sm:px-12">
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-[0.04]"
        style={{
          backgroundImage: grainSvg,
          backgroundRepeat: "repeat",
          backgroundSize: "128px 128px",
        }}
        aria-hidden
      />
      <div className="relative z-10 text-center">
        <span className="text-xl lowercase tracking-wide">thought tiles</span>
      </div>

      <div className="relative z-10 mx-auto max-w-6xl pt-12">
        <div className="grid grid-cols-2 gap-6 md:grid-cols-3 md:gap-12 lg:grid-cols-4 lg:gap-16">
          {sortedThoughts.map((t, i) => {
            const number = String(i + 1).padStart(3, "0");
            return (
              <div
                key={t.id}
                className="transition-opacity"
                style={{
                  opacity: mounted ? 1 : 0,
                  transitionDelay: mounted ? `${i * STAGGER_MS}ms` : "0ms",
                  transitionDuration: `${REVEAL_DURATION_MS}ms`,
                  transitionTimingFunction: REVEAL_EASING,
                }}
              >
                <div className="tile-card-wrapper group relative will-change-transform overflow-hidden rounded-2xl sm:transition-transform sm:duration-200 sm:ease-[cubic-bezier(0.22,1,0.36,1)] sm:hover:-translate-y-[3px] sm:focus-within:-translate-y-[3px]">
                  <Link
                    href={`/thought/${t.id}`}
                    className="block focus:outline-none focus-visible:ring-1 focus-visible:ring-black/20 focus-visible:ring-offset-2 focus-visible:ring-offset-[#fbf7ef]"
                    aria-label={`Tile ${number}, ${t.title}`}
                    data-cursor="hover"
                  >
                    <div className="flex h-36 w-full items-center justify-center bg-transparent">
                      <Image
                        src={t.image}
                        alt=""
                        width={800}
                        height={800}
                        quality={95}
                        className="max-h-full max-w-full object-contain"
                      />
                    </div>
                    <div className="px-3 pb-3 pt-3 text-center font-mono text-sm lowercase tracking-wide">
                      <div className="opacity-70">{number}</div>
                      <div
                        className="min-h-[1.5rem] opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100"
                        style={{ transitionDuration: "var(--dur)", transitionTimingFunction: "var(--ease-out)" }}
                      >
                        {t.title}
                      </div>
                    </div>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
