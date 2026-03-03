"use client";

import { useEffect, useState } from "react";
import { SiteNav } from "../components/site-nav";
import { supabase } from "../supabaseClient";

type BeliefRow = {
  id: number;
  title: string | null;
  content: string;
  bg_index: number;
};

export default function BeliefsPage() {
  const [beliefs, setBeliefs] = useState<BeliefRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("beliefs")
        .select("id, title, content, bg_index")
        .order("created_at", { ascending: false });
      if (error) {
        console.error("fetch beliefs error:", error.message || error.code || JSON.stringify(error), error);
        setBeliefs([]);
      } else {
        setBeliefs((data ?? []) as BeliefRow[]);
      }
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <>
        <SiteNav />
        <main className="min-h-screen flex items-center justify-center">
          <p className="font-mono text-sm opacity-70">Loading…</p>
        </main>
      </>
    );
  }

  return (
    <>
      <SiteNav />
      <main className="w-full">
        {beliefs
          .filter((b) => {
            const body = (b as { content?: string; text?: string }).content ?? (b as { content?: string; text?: string }).text ?? "";
            return body.trim().length > 0;
          })
          .map((b) => {
          const bg = `/beliefs/belief${String(b.bg_index).padStart(2, "0")}.jpg`;
          const body = (b as { content?: string; text?: string }).content ?? (b as { content?: string; text?: string }).text ?? "";
          return (
            <section
              key={b.id}
              className="group"
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                position: "relative",
                background: "#fbf7ef",
                padding: "10px 48px 10px 56px",
                overflow: "hidden",
                borderBottom: "1px solid rgba(0,0,0,0.06)",
              }}
            >
              <div
                className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 absolute inset-0"
                aria-hidden
              >
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    backgroundImage: `url(${bg})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: "rgba(0,0,0,0.2)",
                  }}
                />
              </div>
              <p
                style={{
                  position: "relative",
                  zIndex: 1,
                  fontSize: "clamp(40px, 5.5vw, 96px)",
                  lineHeight: 1.05,
                  letterSpacing: "-0.02em",
                  maxWidth: "1200px",
                  margin: 0,
                  textAlign: "left",
                }}
                className="font-mono font-medium text-black group-hover:text-white transition-colors duration-200"
              >
                {body}
              </p>
            </section>
          );
        })}
      </main>
    </>
  );
}
