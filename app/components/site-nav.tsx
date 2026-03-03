"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function SiteNav() {
  const pathname = usePathname();
  const isThoughts = pathname === "/tiles";
  const isBeliefs = pathname === "/beliefs";

  return (
    <nav className="fixed right-8 top-8 z-20 flex items-center gap-5 font-mono text-sm lowercase tracking-wide text-black/60">
      <Link
        href="/tiles"
        className={`transition-colors hover:text-black ${isThoughts ? "text-black underline" : ""}`}
      >
        thoughts
      </Link>
      <Link
        href="/beliefs"
        className={`transition-colors hover:text-black ${isBeliefs ? "text-black underline" : ""}`}
      >
        beliefs
      </Link>
    </nav>
  );
}
