"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

export function CustomCursor() {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [hasFinePointer, setHasFinePointer] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || typeof window === "undefined") return;
    const mq = window.matchMedia("(pointer: fine)");
    const update = () => setHasFinePointer(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, [mounted]);

  useEffect(() => {
    if (!mounted || !hasFinePointer) return;
    let rafId: number;
    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      targetX = e.clientX;
      targetY = e.clientY;
      setIsVisible(true);
      const el = document.elementFromPoint(e.clientX, e.clientY);
      setIsHovering(!!el?.closest('[data-cursor="hover"]'));
    };

    const tick = () => {
      const ease = 0.15;
      currentX += (targetX - currentX) * ease;
      currentY += (targetY - currentY) * ease;
      setPos({ x: currentX, y: currentY });
      rafId = requestAnimationFrame(tick);
    };

    const handleMouseLeave = () => setIsVisible(false);

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseleave", handleMouseLeave);
    rafId = requestAnimationFrame(tick);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseleave", handleMouseLeave);
      cancelAnimationFrame(rafId);
    };
  }, [mounted, hasFinePointer]);

  const size = isHovering ? 18 : 10;
  const offset = size / 2;

  const cursorEl = (
    <div
      className="custom-cursor"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: size,
        height: size,
        backgroundColor: "#000",
        transform: `translate(${pos.x - offset}px, ${pos.y - offset}px)`,
        opacity: isVisible ? 1 : 0,
        pointerEvents: "none",
        zIndex: 2147483647,
        transition: "width 0.2s ease, height 0.2s ease",
      }}
      aria-hidden
    />
  );

  if (!mounted || typeof document === "undefined" || !hasFinePointer) return null;
  return createPortal(cursorEl, document.body);
}
