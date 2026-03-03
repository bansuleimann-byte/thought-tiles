"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";
import { SiteNav } from "../../components/site-nav";

type BeliefRow = {
  id: number;
  content: string;
  bg_index: number;
};

type NavId = { id: number };

export default function BeliefPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [belief, setBelief] = useState<BeliefRow | null>(null);
  const [prevId, setPrevId] = useState<number | null>(null);
  const [nextId, setNextId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const numId = Number(id);
    if (Number.isNaN(numId)) {
      setBelief(null);
      setLoading(false);
      return;
    }

    (async () => {
      const { data: row, error } = await supabase
        .from("beliefs")
        .select("id, content, bg_index")
        .eq("id", numId)
        .single();

      if (error || !row) {
        setBelief(null);
        setLoading(false);
        return;
      }
      setBelief(row as BeliefRow);

      const { data: list } = await supabase
        .from("beliefs")
        .select("id")
        .order("created_at", { ascending: false });
      const ids = (list ?? []) as NavId[];
      const idx = ids.findIndex((r) => r.id === numId);
      setPrevId(idx > 0 ? ids[idx - 1].id : null);
      setNextId(idx >= 0 && idx < ids.length - 1 ? ids[idx + 1].id : null);
      setLoading(false);
    })();
  }, [id]);

  useEffect(() => {
    if (!belief) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") router.push("/beliefs");
      else if (e.key === "ArrowLeft" && prevId !== null) router.push(`/belief/${prevId}`);
      else if (e.key === "ArrowRight" && nextId !== null) router.push(`/belief/${nextId}`);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [router, belief, prevId, nextId]);

  if (loading) {
    return (
      <>
        <SiteNav />
        <main className="fade-in min-h-screen bg-[#fbf7ef] px-8 py-24 text-black sm:px-12">
          <div className="mx-auto max-w-[720px] space-y-8">
            <div className="text-sm opacity-60">loading…</div>
          </div>
        </main>
      </>
    );
  }

  if (!belief) {
    return (
      <>
        <SiteNav />
        <main className="fade-in min-h-screen bg-[#fbf7ef] px-8 py-24 text-black sm:px-12">
          <div className="mx-auto max-w-[720px] space-y-8">
            <Link
              href="/beliefs"
              className="inline-block font-mono text-sm opacity-60 no-underline transition hover:opacity-100"
            >
              ← beliefs
            </Link>
            <div className="text-sm opacity-60">not found.</div>
          </div>
        </main>
      </>
    );
  }

  const bgSrc = `/beliefs/belief${String(belief.bg_index).padStart(2, "0")}.jpg`;
  const content = belief.content ?? "";

  return (
    <>
      <SiteNav />
      <main className="fade-in min-h-screen bg-[#fbf7ef] px-8 py-24 text-black sm:px-12">
        <div className="mx-auto max-w-[720px] space-y-8">
          <Link
            href="/beliefs"
            className="inline-block font-mono text-sm opacity-60 no-underline transition hover:opacity-100"
          >
            ← beliefs
          </Link>

          <div
            className="relative min-h-[280px] w-full overflow-hidden rounded-lg"
            style={{
              backgroundImage: `url(${bgSrc})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            <div
              className="absolute inset-0"
              style={{ background: "rgba(0,0,0,0.35)" }}
              aria-hidden
            />
            <div className="relative flex min-h-[280px] items-end p-6 sm:p-8">
              <p
                className="font-mono font-medium text-white"
                style={{
                  fontSize: "clamp(28px, 4vw, 48px)",
                  lineHeight: 1.08,
                  letterSpacing: "-0.02em",
                  maxWidth: "100%",
                }}
              >
                {content}
              </p>
            </div>
          </div>

          <div className="flex gap-6 pt-4 font-mono text-sm">
            {prevId !== null && (
              <Link
                href={`/belief/${prevId}`}
                className="opacity-60 no-underline transition hover:opacity-100"
                style={{ transitionDuration: "var(--dur)", transitionTimingFunction: "var(--ease-out)" }}
              >
                prev
              </Link>
            )}
            {nextId !== null && (
              <Link
                href={`/belief/${nextId}`}
                className="opacity-60 no-underline transition hover:opacity-100"
                style={{ transitionDuration: "var(--dur)", transitionTimingFunction: "var(--ease-out)" }}
              >
                next
              </Link>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
