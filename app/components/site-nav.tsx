"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function SiteNav() {
  const pathname = usePathname();
  const isThoughts = pathname === "/tiles";
  const isBeliefs = pathname === "/beliefs";

  return (
    <nav className="fixed top-0 left-0 right-0 z-20 flex flex-row justify-end items-center px-4 py-3 gap-3 font-mono text-xs lowercase tracking-wide text-black/60 sm:left-auto sm:right-8 sm:top-8 sm:px-0 sm:py-0 sm:gap-5 sm:text-sm">
      <Link
        href="/tiles"
        className={`min-w-0 max-w-[70%] truncate transition-colors hover:text-black sm:max-w-none sm:truncate-none ${isThoughts ? "text-black underline" : ""}`}
      >
        thoughts
      </Link>
      <Link
        href="/beliefs"
        className={`shrink-0 transition-colors hover:text-black ${isBeliefs ? "text-black underline" : ""}`}
      >
        beliefs
      </Link>
    </nav>
  );
}
