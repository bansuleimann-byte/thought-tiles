"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { use, useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";

type ThoughtRow = {
  id: number;
  title: string | null;
  content: string | null;
  date: string | null;
};

type ThoughtImageRow = {
  id: number;
  thought_id: number;
  path: string;
  sort: number;
  created_at: string;
};

type NavId = { id: number };

export default function ThoughtPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [thought, setThought] = useState<ThoughtRow | null>(null);
  const [images, setImages] = useState<ThoughtImageRow[]>([]);
  const [prevId, setPrevId] = useState<number | null>(null);
  const [nextId, setNextId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const numId = Number(id);
    if (Number.isNaN(numId)) {
      setThought(null);
      setImages([]);
      setLoading(false);
      return;
    }

    (async () => {
      const { data: row, error } = await supabase
        .from("thoughts")
        .select("id, title, content, date")
        .eq("id", numId)
        .single();

      if (error || !row) {
        setThought(null);
        setImages([]);
        setLoading(false);
        return;
      }
      setThought(row as ThoughtRow);

      const { data: imgRows } = await supabase
        .from("thought_images")
        .select("id, thought_id, path, sort, created_at")
        .eq("thought_id", numId)
        .order("sort", { ascending: true })
        .order("created_at", { ascending: true });
      setImages((imgRows ?? []) as ThoughtImageRow[]);

      const { data: list } = await supabase
        .from("thoughts")
        .select("id")
        .order("date", { ascending: false })
        .order("id", { ascending: false });
      const ids = (list ?? []) as NavId[];
      const idx = ids.findIndex((r) => r.id === numId);
      setPrevId(idx > 0 ? ids[idx - 1].id : null);
      setNextId(idx >= 0 && idx < ids.length - 1 ? ids[idx + 1].id : null);
      setLoading(false);
    })();
  }, [id]);

  useEffect(() => {
    if (!thought) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") router.push("/tiles");
      else if (e.key === "ArrowLeft" && prevId !== null) router.push(`/thought/${prevId}`);
      else if (e.key === "ArrowRight" && nextId !== null) router.push(`/thought/${nextId}`);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [router, thought, prevId, nextId]);

  if (loading) {
    return (
      <main className="fade-in min-h-screen bg-[#fbf7ef] px-8 py-24 text-black sm:px-12">
        <div className="mx-auto max-w-[720px] space-y-8">
          <div className="text-sm opacity-60">loading…</div>
        </div>
      </main>
    );
  }

  if (!thought) {
    return (
      <main className="fade-in min-h-screen bg-[#fbf7ef] px-8 py-24 text-black sm:px-12">
        <div className="mx-auto max-w-[720px] space-y-8">
          <Link
            href="/tiles"
            className="inline-block aspect-square w-12 overflow-hidden bg-neutral-100 opacity-80 transition hover:opacity-100"
            style={{ transitionDuration: "var(--dur)", transitionTimingFunction: "var(--ease-out)" }}
          >
            <div className="h-full w-full bg-neutral-200" />
          </Link>
          <div className="text-sm opacity-60">not found.</div>
        </div>
      </main>
    );
  }

  const title = thought.title ?? "";
  const content = thought.content ?? "";

  return (
    <main className="fade-in min-h-screen bg-[#fbf7ef] px-8 py-24 text-black sm:px-12">
      <div className="mx-auto max-w-[720px] space-y-8">
        <div className="-mt-12 mb-8">
          <Link
            href="/tiles"
            className="inline-block aspect-square w-12 overflow-hidden opacity-80 transition hover:opacity-100"
            style={{ transitionDuration: "var(--dur)", transitionTimingFunction: "var(--ease-out)" }}
          >
            <Image
              src={`/tiles/tile${thought.id}.jpg`}
              alt={title}
              width={96}
              height={96}
              quality={95}
              className="h-full w-full object-cover"
            />
          </Link>
        </div>
        <h1 className="font-mono text-base lowercase tracking-wide">{title}</h1>

        <div className="whitespace-pre-line font-mono text-sm leading-relaxed tracking-wide">
          {content}
        </div>

        {images.length > 0 && (
          <div className="space-y-4 pt-6">
            {images.map((img) => {
              const { data } = supabase.storage.from("thought-images").getPublicUrl(img.path);
              return (
                <img
                  key={img.id}
                  src={data.publicUrl}
                  alt=""
                  className="block w-full max-w-[560px] h-auto"
                  style={{ objectFit: "contain" }}
                />
              );
            })}
          </div>
        )}

        <div className="pt-6 font-mono text-sm opacity-60">{thought.date ?? ""}</div>

        <div className="flex gap-6 pt-16 font-mono text-sm">
          {prevId !== null && (
            <Link
              href={`/thought/${prevId}`}
              className="opacity-60 no-underline transition hover:opacity-100"
              style={{ transitionDuration: "var(--dur)", transitionTimingFunction: "var(--ease-out)" }}
            >
              prev
            </Link>
          )}
          {nextId !== null && (
            <Link
              href={`/thought/${nextId}`}
              className="opacity-60 no-underline transition hover:opacity-100"
              style={{ transitionDuration: "var(--dur)", transitionTimingFunction: "var(--ease-out)" }}
            >
              next
            </Link>
          )}
        </div>
      </div>
    </main>
  );
}
