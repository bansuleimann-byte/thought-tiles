"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { use, useEffect } from "react";
import { thoughts } from "../../thoughts";

const sortedThoughts = [...thoughts].sort((a, b) => {
  if (!a.date) return 1;
  if (!b.date) return -1;
  return new Date(b.date).getTime() - new Date(a.date).getTime();
});

export default function ThoughtPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const index = sortedThoughts.findIndex((t) => t.id === Number(id));
  const thought = index >= 0 ? sortedThoughts[index] : null;
  const prevThought = index > 0 ? sortedThoughts[index - 1] : null;
  const nextThought = index >= 0 && index < sortedThoughts.length - 1 ? sortedThoughts[index + 1] : null;

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") router.push("/tiles");
      else if (e.key === "ArrowLeft" && prevThought) router.push(`/thought/${prevThought.id}`);
      else if (e.key === "ArrowRight" && nextThought) router.push(`/thought/${nextThought.id}`);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [router, prevThought, nextThought]);

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
              src={thought.image}
              alt=""
              width={96}
              height={96}
              quality={95}
              className="h-full w-full object-cover"
            />
          </Link>
        </div>
        <h1 className="font-mono text-base lowercase tracking-wide">{thought.title}</h1>

        <div className="whitespace-pre-line font-mono text-sm leading-relaxed tracking-wide">
          {thought.content}
        </div>

        <div className="pt-6 font-mono text-sm opacity-60">{thought.date}</div>

        <div className="flex gap-6 pt-16 font-mono text-sm">
          {prevThought && (
            <Link
              href={`/thought/${prevThought.id}`}
              className="opacity-60 no-underline transition hover:opacity-100"
              style={{ transitionDuration: "var(--dur)", transitionTimingFunction: "var(--ease-out)" }}
            >
              prev
            </Link>
          )}
          {nextThought && (
            <Link
              href={`/thought/${nextThought.id}`}
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