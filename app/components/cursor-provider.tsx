"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { CustomCursor } from "./custom-cursor";

export function CursorProvider() {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin") ?? false;

  useEffect(() => {
    if (isAdmin) {
      document.body.setAttribute("data-route", "admin");
      document.documentElement.classList.remove("native-cursor-hidden");
    } else {
      document.body.removeAttribute("data-route");
      document.documentElement.classList.add("native-cursor-hidden");
    }
    return () => {
      document.body.removeAttribute("data-route");
      document.documentElement.classList.remove("native-cursor-hidden");
    };
  }, [isAdmin]);

  if (isAdmin) return null;
  return <CustomCursor />;
}
