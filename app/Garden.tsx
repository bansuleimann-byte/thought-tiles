"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

type Thought = {
  id: number;
  title: string;
  x: number;
  y: number;
};

const PADDING = 12;
const NUDGE = 16;
const SMALL_SCREEN = 640;

function overlaps(a: DOMRect, b: DOMRect, padding: number): boolean {
  return (
    a.left < b.right + padding &&
    a.right + padding > b.left &&
    a.top < b.bottom + padding &&
    a.bottom + padding > b.top
  );
}

export function Garden({ thoughts }: { thoughts: Thought[] }) {
  const refs = useRef<(HTMLDivElement | null)[]>([]);
  const [offsets, setOffsets] = useState<Record<number, { x: number; y: number }>>({});

  const resolve = useCallback(() => {
    if (typeof window === "undefined" || window.innerWidth >= SMALL_SCREEN) {
      setOffsets({});
      return;
    }

    const rects = refs.current.filter(Boolean).map((el) => el!.getBoundingClientRect());
    const container = refs.current[0]?.parentElement?.getBoundingClientRect();
    if (!container || rects.length !== thoughts.length) return;

    const result: Record<number, { x: number; y: number }> = {};
    let changed = true;
    let iter = 0;

    while (changed && iter < 8) {
      changed = false;
      const prev = { ...result };

      for (let i = 0; i < thoughts.length; i++) {
        const oi = prev[thoughts[i].id] ?? { x: 0, y: 0 };
        let dx = oi.x;
        let dy = oi.y;

        for (let j = 0; j < thoughts.length; j++) {
          if (i === j) continue;

          const oj = prev[thoughts[j].id] ?? { x: 0, y: 0 };

          const ri = {
            ...rects[i],
            left: rects[i].left + oi.x,
            right: rects[i].right + oi.x,
            top: rects[i].top + oi.y,
            bottom: rects[i].bottom + oi.y,
          };

          const rj = {
            ...rects[j],
            left: rects[j].left + oj.x,
            right: rects[j].right + oj.x,
            top: rects[j].top + oj.y,
            bottom: rects[j].bottom + oj.y,
          };

          if (!overlaps(ri, rj, PADDING)) continue;

          const overlapX = Math.min(ri.right - rj.left, rj.right - ri.left) + PADDING;
          const overlapY = Math.min(ri.bottom - rj.top, rj.bottom - ri.top) + PADDING;

          if (overlapX < overlapY) {
            dx += ri.left + ri.width / 2 < rj.left + rj.width / 2 ? -NUDGE : NUDGE;
          } else {
            dy += ri.top + ri.height / 2 < rj.top + rj.height / 2 ? -NUDGE : NUDGE;
          }

          changed = true;
        }

        result[thoughts[i].id] = { x: dx, y: dy };
      }

      iter++;
    }

    const hasOffsets = Object.values(result).some((o) => o.x !== 0 || o.y !== 0);
    setOffsets((prev) => {
      if (!hasOffsets) return {};

      const same = thoughts.every(
        (t) =>
          (prev[t.id]?.x ?? 0) === (result[t.id]?.x ?? 0) &&
          (prev[t.id]?.y ?? 0) === (result[t.id]?.y ?? 0)
      );

      return same ? prev : result;
    });
  }, [thoughts]);

  useEffect(() => {
    resolve();
    const ro = new ResizeObserver(resolve);
    ro.observe(document.documentElement);
    window.addEventListener("resize", resolve);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", resolve);
    };
  }, [resolve]);

  return (
    <div className="relative h-screen w-full">
      {thoughts.map((t, i) => {
        const off = offsets[t.id] ?? { x: 0, y: 0 };
        return (
          <div
            key={t.id}
            ref={(el) => {
              refs.current[i] = el;
            }}
            className="absolute max-w-[320px] text-sm leading-relaxed transition-transform duration-200 ease-out"
            style={{
              left: `${t.x}%`,
              top: `${t.y}%`,
              transform: `translate(calc(-50% + ${off.x}px), calc(-50% + ${off.y}px))`,
            }}
          >
            <Link
              href={`/thought/${t.id}`}
              className="border-b-[0.5px] border-transparent hover:border-black transition-all duration-200"
            >
              {String(i + 1).padStart(2, "0")} — {t.title}
            </Link>
          </div>
        );
      })}
    </div>
  );
}