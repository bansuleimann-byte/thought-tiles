"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "../supabaseClient";
import { SiteNav } from "../components/site-nav";

type ThoughtRow = {
  id: number;
  title: string | null;
  date: string | null;
  tile_number: number | null;
  created_at: string | null;
};

const grainSvg = `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`;

const STAGGER_MS = 24;
const REVEAL_DURATION_MS = 420;
const REVEAL_EASING = "cubic-bezier(0.22, 1, 0.36, 1)";

export default function TilesPage() {
  const [thoughts, setThoughts] = useState<ThoughtRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  const [subEmail, setSubEmail] = useState("");
  const [subOpen, setSubOpen] = useState(false);
  const [subStatus, setSubStatus] = useState<"idle" | "loading" | "success" | "already" | "error">("idle");

  const handleSubscribe = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setSubStatus("loading");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: subEmail }),
      });
      if (res.ok) {
        setSubStatus("success");
        setSubEmail("");
      } else if (res.status === 409) {
        setSubStatus("already");
        setSubOpen(false);
      } else {
        setSubStatus("error");
      }
    } catch {
      setSubStatus("error");
    }
  }, [subEmail]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("thoughts")
        .select("id, title, date, tile_number, created_at");
      if (error) {
        console.error("thoughts fetch error:", error.message ?? error.code ?? error);
        setThoughts([]);
      } else {
        setThoughts(data ?? []);
      }
      setLoading(false);
    })();
  }, []);

  return (
    <main className="fade-in relative min-h-screen select-none bg-[#fbf7ef] px-6 py-10 text-black sm:px-10 sm:py-12">
      <SiteNav />

      {/* Subscribe bar — mobile only, fixed bottom */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-20 bg-[#fbf7ef]/90 backdrop-blur-sm border-t border-black/10 px-5 py-3 font-mono text-xs lowercase tracking-wide text-black/60">
        {subStatus === "success" ? (
          <span>subscribed ✦</span>
        ) : subStatus === "already" ? (
          <span>already subscribed</span>
        ) : subOpen ? (
          <form onSubmit={handleSubscribe} className="flex items-center gap-3">
            <input
              type="email"
              value={subEmail}
              onChange={(e) => setSubEmail(e.target.value)}
              placeholder="your@email.com"
              autoFocus
              required
              className="flex-1 bg-transparent border-b border-black/30 outline-none font-mono text-xs lowercase tracking-wide placeholder:opacity-30 pb-px"
            />
            <button type="submit" disabled={subStatus === "loading"} className="transition-colors hover:text-black disabled:opacity-40 shrink-0">
              {subStatus === "loading" ? "…" : "→"}
            </button>
            <button type="button" onClick={() => { setSubOpen(false); setSubStatus("idle"); setSubEmail(""); }} className="opacity-40 hover:text-black transition-colors shrink-0">
              ✕
            </button>
          </form>
        ) : (
          <button type="button" onClick={() => setSubOpen(true)} className="transition-colors hover:text-black text-left">
            subscribe
            <span className="block text-[10px] opacity-40 mt-0.5 normal-case tracking-normal">new thoughts, straight to your inbox</span>
          </button>
        )}
      </div>

      {/* Subscribe widget — desktop only, mirrors SiteNav top-left */}
      <div className="hidden sm:flex fixed top-0 left-0 z-20 items-center sm:left-8 sm:top-8 sm:px-0 sm:py-0 pointer-events-none">
        <div className="pointer-events-auto font-mono text-xs lowercase tracking-wide text-black/60 sm:text-sm">
          {subStatus === "success" ? (
            <span>subscribed ✦</span>
          ) : subStatus === "already" ? (
            <span>already subscribed</span>
          ) : subOpen ? (
            <form onSubmit={handleSubscribe} className="flex items-center gap-2">
              <input
                type="email"
                value={subEmail}
                onChange={(e) => setSubEmail(e.target.value)}
                placeholder="your@email.com"
                autoFocus
                required
                className="w-28 sm:w-36 bg-transparent border-b border-black/30 outline-none font-mono text-xs lowercase tracking-wide placeholder:opacity-30 pb-px"
              />
              <button
                type="submit"
                disabled={subStatus === "loading"}
                className="transition-colors hover:text-black disabled:opacity-40"
              >
                {subStatus === "loading" ? "…" : "→"}
              </button>
              <button
                type="button"
                onClick={() => { setSubOpen(false); setSubStatus("idle"); setSubEmail(""); }}
                className="transition-colors hover:text-black opacity-40"
              >
                ✕
              </button>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setSubOpen(true)}
              className="transition-colors hover:text-black text-left"
            >
              subscribe
              <span className="block text-[10px] opacity-40 mt-0.5 normal-case tracking-normal">new thoughts, straight to your inbox</span>
            </button>
          )}
        </div>
      </div>
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-35"
        style={{
          backgroundImage: "url(/background/GUEST_9ac77de0-9217-4408-a98f-bb5ca1e5beb6.webp)",
          backgroundRepeat: "repeat",
          backgroundSize: "400px 400px",
        }}
        aria-hidden
      />
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
        {loading && (
          <span className="text-sm lowercase opacity-60">loading…</span>
        )}
        {!loading && (
          <span className="mt-6 block text-xl lowercase tracking-wide sm:mt-0 sm:text-2xl">thought tiles</span>
        )}
      </div>

      <div className="relative z-10 mx-auto w-full max-w-[92rem] pt-8 sm:pt-20">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 md:gap-4 lg:gap-5">
          {(() => {
            const sortedThoughts = [...thoughts].sort((a, b) => {
              const dateA = a.date ?? "";
              const dateB = b.date ?? "";
              if (dateA !== dateB) return dateB.localeCompare(dateA);
              const createdA = a.created_at ?? "";
              const createdB = b.created_at ?? "";
              if (createdA !== createdB) return createdB.localeCompare(createdA);
              return (b.id ?? 0) - (a.id ?? 0);
            });
            const total = sortedThoughts.length;
            return sortedThoughts.map((t, i) => {
              const number = String(total - i).padStart(3, "0");
              const title = t.title ?? "";
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
                  <div className="tile-card-wrapper group relative will-change-transform overflow-hidden sm:transition-transform sm:duration-200 sm:ease-[cubic-bezier(0.22,1,0.36,1)] sm:hover:-translate-y-[3px] sm:focus-within:-translate-y-[3px]">
                    <Link
                      href={`/thought/${t.id}`}
                      className="block focus:outline-none focus-visible:ring-1 focus-visible:ring-black/20 focus-visible:ring-offset-2 focus-visible:ring-offset-[#fbf7ef]"
                      aria-label={`Tile ${number}, ${title}`}
                      data-cursor="hover"
                    >
                      <div className="relative aspect-square w-full overflow-hidden bg-black/5">
                        <Image
                          src={`/tiles/tile${t.tile_number ?? t.id}.jpg`}
                          alt={t.title ?? ""}
                          fill
                          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                          className="object-cover"
                          priority={i < 10}
                        />
                      </div>
                      <div className="relative flex items-center justify-center px-1 pt-1.5 font-mono text-sm lowercase tracking-wide text-black min-h-[1.5rem]">
                        <span className="absolute left-0 max-w-[85%] truncate opacity-0 transition-opacity duration-200 group-hover:opacity-100 text-black">
                          {title || "—"}
                        </span>
                        <span className="transition-all duration-200 group-hover:ml-auto">{number}</span>
                      </div>
                    </Link>
                  </div>
                </div>
              );
            });
          })()}
        </div>
      </div>

    </main>
  );
}
