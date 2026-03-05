"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

function safeFileName(name: string) {
  return name
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9._-]/g, "");
}

type ThoughtRow = {
  id: number;
  title: string | null;
  date: string | null;
  content: string | null;
};

const BELIEF_BG_COUNT = 12; // /public/beliefs/belief01.jpg … belief12.jpg

type BeliefRow = {
  id: number;
  content: string;
  created_at: string;
  bg_index: number;
};

export default function AdminPage() {
  const router = useRouter();
  const supabase = useMemo(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    return createClient(url, key);
  }, []);

  const [loading, setLoading] = useState(true);
  const [sessionEmail, setSessionEmail] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [date, setDate] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [thoughts, setThoughts] = useState<ThoughtRow[]>([]);
  const [listLoading, setListLoading] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editContent, setEditContent] = useState("");

  // Beliefs section state (background from /public/beliefs; auto or admin-chosen)
  // Newsletter state
  const [subscriberCount, setSubscriberCount] = useState<number | null>(null);
  const [newsletterThoughtId, setNewsletterThoughtId] = useState<number | null>(null);
  const [sendingNewsletter, setSendingNewsletter] = useState(false);
  const [newsletterMessage, setNewsletterMessage] = useState<string | null>(null);

  const [beliefText, setBeliefText] = useState("");
  const [beliefBgChoice, setBeliefBgChoice] = useState<number | null>(null); // null = auto
  const [beliefs, setBeliefs] = useState<BeliefRow[]>([]);
  const [beliefsListLoading, setBeliefsListLoading] = useState(false);
  const [savingBelief, setSavingBelief] = useState(false);
  const [beliefSuccessMessage, setBeliefSuccessMessage] = useState<string | null>(null);
  const [editingBeliefId, setEditingBeliefId] = useState<number | null>(null);
  const [editBeliefText, setEditBeliefText] = useState("");
  const [editBeliefBgChoice, setEditBeliefBgChoice] = useState<number | null>(null); // null = don't change
  const [beliefTableMissing, setBeliefTableMissing] = useState(false);

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);

  const ADMIN_EMAIL = "bansuleimann@gmail.com";

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.auth.getSession();
      const email = data.session?.user?.email ?? null;
      setSessionEmail(email);
      setLoading(false);
    };
    load();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setSessionEmail(session?.user?.email ?? null);
    });

    return () => {
      sub.subscription.unsubscribe();
    };
  }, [supabase]);

  const signOut = async () => {
    await supabase.auth.signOut();
    router.refresh();
  };

  const handleLogin = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setLoginError(null);
      setLoginLoading(true);
      const { error } = await supabase.auth.signInWithPassword({
        email: loginEmail.trim(),
        password: loginPassword,
      });
      setLoginLoading(false);
      if (error) {
        setLoginError(error.message);
        return;
      }
      setLoginEmail("");
      setLoginPassword("");
      router.refresh();
    },
    [supabase, loginEmail, loginPassword, router]
  );

  const fetchThoughts = useCallback(async () => {
    setListLoading(true);
    const { data, error } = await supabase
      .from("thoughts")
      .select("id, title, date, content")
      .order("id", { ascending: false })
      .limit(50);
    if (error) {
      console.error("fetch thoughts error:", error);
      setThoughts([]);
    } else {
      setThoughts((data ?? []) as ThoughtRow[]);
    }
    setListLoading(false);
  }, []);

  const fetchSubscriberCount = useCallback(async () => {
    const { count } = await supabase
      .from("subscribers")
      .select("*", { count: "exact", head: true });
    setSubscriberCount(count ?? 0);
  }, [supabase]);

  const sendNewsletter = useCallback(async () => {
    const thought =
      (newsletterThoughtId != null
        ? thoughts.find((t) => t.id === newsletterThoughtId)
        : null) ?? thoughts[0];
    if (!thought) {
      alert("No thought selected.");
      return;
    }
    setSendingNewsletter(true);
    setNewsletterMessage(null);
    const { data: { session } } = await supabase.auth.getSession();
    const accessToken = session?.access_token;
    const res = await fetch("/api/send-newsletter", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        thoughtId: thought.id,
        title: thought.title ?? "",
        content: thought.content ?? "",
        date: thought.date ?? "",
        accessToken,
      }),
    });
    const json = await res.json();
    setSendingNewsletter(false);
    if (res.ok) {
      setNewsletterMessage(
        json.count === 0
          ? "no subscribers yet."
          : `sent to ${json.count} subscriber${json.count !== 1 ? "s" : ""} ✦`
      );
    } else {
      setNewsletterMessage(json.error ?? "something went wrong.");
    }
  }, [thoughts, newsletterThoughtId, supabase]);

  const fetchBeliefs = useCallback(async () => {
    setBeliefsListLoading(true);
    setBeliefTableMissing(false);
    const { data, error } = await supabase
      .from("beliefs")
      .select("id, content, created_at, bg_index")
      .order("created_at", { ascending: false });
    if (error) {
      const err = error;
      const msg = (err.message || "").toLowerCase();
      if (msg.includes("could not find the table") || msg.includes("schema cache")) {
        setBeliefTableMissing(true);
        setBeliefs([]);
      } else {
        console.error("fetch beliefs error:", err.message || err.code || JSON.stringify(err), err);
        if (err.code === "PGRST116" || err.message?.includes("column") || err.message?.includes("does not exist")) {
          const fallback = await supabase
            .from("beliefs")
            .select("id, content, created_at")
            .order("created_at", { ascending: false });
          if (fallback.error) {
            console.error("fetch beliefs (minimal) error:", fallback.error.message, fallback.error);
            setBeliefs([]);
          } else {
            setBeliefs(
              ((fallback.data ?? []) as { id: number; content: string; created_at: string }[]).map((r) => ({
                id: r.id,
                content: r.content,
                created_at: r.created_at,
                bg_index: 1,
              }))
            );
          }
        } else {
          setBeliefs([]);
        }
      }
    } else {
      setBeliefs((data ?? []) as BeliefRow[]);
    }
    setBeliefsListLoading(false);
  }, [supabase]);

  useEffect(() => {
    if (sessionEmail === ADMIN_EMAIL) {
      fetchThoughts();
      fetchBeliefs();
      fetchSubscriberCount();
    }
  }, [sessionEmail, fetchThoughts, fetchBeliefs, fetchSubscriberCount]);

  const startEdit = useCallback((t: ThoughtRow) => {
    setEditingId(t.id);
    setEditTitle(t.title ?? "");
    setEditDate(t.date ?? "");
    setEditContent(t.content ?? "");
  }, []);

  const cancelEdit = useCallback(() => {
    setEditingId(null);
    setEditTitle("");
    setEditDate("");
    setEditContent("");
  }, []);

  const saveEdit = useCallback(async () => {
    if (editingId == null) return;
    const { error } = await supabase
      .from("thoughts")
      .update({ title: editTitle || null, date: editDate || null, content: editContent || null })
      .eq("id", editingId);
    if (error) {
      console.error("update thought error:", error);
      alert(error.message);
      return;
    }
    cancelEdit();
    await fetchThoughts();
  }, [editingId, editTitle, editDate, editContent, cancelEdit, fetchThoughts]);

  const deleteThought = useCallback(
    async (id: number) => {
      if (!confirm("Delete this thought? This cannot be undone.")) return;
      const { data: imgRows } = await supabase.from("thought_images").select("path").eq("thought_id", id);
      const paths = (imgRows ?? []).map((r: { path: string }) => r.path);
      if (paths.length > 0) {
        const { error: storageErr } = await supabase.storage.from("thought-images").remove(paths);
        if (storageErr) console.error("storage remove error:", storageErr);
      }
      const { error: imgErr } = await supabase.from("thought_images").delete().eq("thought_id", id);
      if (imgErr) console.error("delete thought_images error:", imgErr);
      const { error } = await supabase.from("thoughts").delete().eq("id", id);
      if (error) {
        console.error("delete thought error:", error);
        alert(error.message);
        return;
      }
      if (editingId === id) cancelEdit();
      await fetchThoughts();
    },
    [editingId, cancelEdit, fetchThoughts]
  );

  const insertBelief = useCallback(async () => {
    if (!sessionEmail || sessionEmail !== ADMIN_EMAIL) {
      alert("Not authorized.");
      return;
    }
    const textTrimmed = beliefText.trim();
    if (!textTrimmed) {
      alert("Content is required.");
      return;
    }
    setBeliefSuccessMessage(null);
    setSavingBelief(true);

    let bgIndex: number;
    if (beliefBgChoice != null) {
      bgIndex = beliefBgChoice;
    } else {
      const { data: latest } = await supabase
        .from("beliefs")
        .select("bg_index")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      bgIndex =
        latest?.bg_index != null
          ? (latest.bg_index % BELIEF_BG_COUNT) + 1
          : 1;
    }

    const { error } = await supabase
      .from("beliefs")
      .insert({
        content: textTrimmed,
        bg_index: bgIndex,
      })
      .select("id")
      .single();

    if (error) {
      console.error("beliefs insert error:", error);
      alert(error.message);
      setSavingBelief(false);
      return;
    }
    setBeliefText("");
    setBeliefBgChoice(null);
    setBeliefSuccessMessage("Saved.");
    setSavingBelief(false);
    setTimeout(() => setBeliefSuccessMessage(null), 1200);
    fetchBeliefs();
  }, [sessionEmail, beliefText, beliefBgChoice, fetchBeliefs]);

  const startEditBelief = useCallback((b: BeliefRow) => {
    setEditingBeliefId(b.id);
    setEditBeliefText(b.content);
    setEditBeliefBgChoice(b.bg_index);
  }, []);

  const cancelEditBelief = useCallback(() => {
    setEditingBeliefId(null);
    setEditBeliefText("");
    setEditBeliefBgChoice(null);
  }, []);

  const saveEditBelief = useCallback(async () => {
    if (editingBeliefId == null) return;
    const textTrimmed = editBeliefText.trim();
    if (!textTrimmed) {
      alert("Content is required.");
      return;
    }
    const payload: { content: string; updated_at: string; bg_index?: number } = {
      content: textTrimmed,
      updated_at: new Date().toISOString(),
    };
    if (editBeliefBgChoice != null) {
      payload.bg_index = editBeliefBgChoice;
    }
    const { error } = await supabase
      .from("beliefs")
      .update(payload)
      .eq("id", editingBeliefId);
    if (error) {
      console.error("update belief error:", error);
      alert(error.message);
      return;
    }
    cancelEditBelief();
    await fetchBeliefs();
  }, [editingBeliefId, editBeliefText, editBeliefBgChoice, cancelEditBelief, fetchBeliefs]);

  const deleteBelief = useCallback(
    async (id: number) => {
      if (!confirm("Delete this belief? This cannot be undone.")) return;
      const { error } = await supabase.from("beliefs").delete().eq("id", id);
      if (error) {
        console.error("delete belief error:", error);
        alert(error.message);
        return;
      }
      if (editingBeliefId === id) cancelEditBelief();
      await fetchBeliefs();
    },
    [editingBeliefId, cancelEditBelief, fetchBeliefs]
  );

  const insertThought = useCallback(async () => {
    if (!sessionEmail) {
      alert("Not logged in.");
      return;
    }
    if (sessionEmail !== ADMIN_EMAIL) {
      await supabase.auth.signOut();
      alert("Not authorized.");
      return;
    }

    setSuccessMessage(null);
    setSaving(true);

    const { count, error: countError } = await supabase
      .from("thoughts")
      .select("*", { count: "exact", head: true });
    if (countError) {
      console.error("count error:", countError);
      alert(countError.message);
      setSaving(false);
      return;
    }
    if (count != null && count >= 38) {
      alert("You already have 38 thoughts (tile1–tile38). Delete one before adding a new thought.");
      setSaving(false);
      return;
    }
    const { data: maxRow, error: maxError } = await supabase
      .from("thoughts")
      .select("tile_number")
      .order("tile_number", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (maxError) {
      console.error("max tile_number error:", maxError);
      alert(maxError.message);
      setSaving(false);
      return;
    }
    const tile_number = (maxRow?.tile_number != null ? maxRow.tile_number + 1 : 1);
    const { data: inserted, error } = await supabase
      .from("thoughts")
      .insert([{ title, content, date: date || null, tile_number }])
      .select("id")
      .single();

    if (error) {
      console.error("thoughts insert error:", error);
      alert(error.message);
      setSaving(false);
      return;
    }

    const thoughtId = inserted?.id;
    const filesToUpload = files;
    if (thoughtId != null && filesToUpload.length > 0) {
      const timestamp = Date.now();
      for (let i = 0; i < filesToUpload.length; i++) {
        const file = filesToUpload[i];
        const rawExt = file.name.split(".").pop();
        const ext = (rawExt && safeFileName(rawExt)) || "jpg";
        const filePath = `thoughts/${thoughtId}/${timestamp}-${i}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("thought-images")
          .upload(filePath, file, { upsert: false, contentType: file.type });
        if (uploadError) {
          console.error("storage upload error:", uploadError);
          alert(uploadError.message);
          setSaving(false);
          return;
        }
        const { error: imgError } = await supabase.from("thought_images").insert({
          thought_id: thoughtId,
          path: filePath,
          sort: i,
        });
        if (imgError) {
          console.error("thought_images insert error:", imgError);
          alert(imgError.message);
          setSaving(false);
          return;
        }
      }
    }

    setTitle("");
    setContent("");
    setDate("");
    setFiles([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setSuccessMessage("Saved.");
    setSaving(false);
    setTimeout(() => setSuccessMessage(null), 1200);
    fetchThoughts();
  }, [sessionEmail, title, content, date, files, fetchThoughts]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isTextarea = target.tagName === "TEXTAREA";
      if (e.key === "Escape") {
        if (editingId != null) {
          cancelEdit();
          return;
        }
        setTitle("");
        setContent("");
        setDate("");
        setFiles([]);
        return;
      }
      if (editingId != null) {
        if (e.key === "Enter" && !isTextarea) {
          e.preventDefault();
          saveEdit();
        }
        return;
      }
      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        insertThought();
        return;
      }
      if (e.key === "Enter" && isTextarea) return;
      if (e.key === "Enter") {
        e.preventDefault();
        insertThought();
      }
    },
    [insertThought, editingId, cancelEdit, saveEdit]
  );

  if (loading) {
    return (
      <div className="cursor-auto min-h-screen bg-[#fbf7ef] flex items-center justify-center">
        <p className="font-mono text-sm opacity-70">Loading…</p>
      </div>
    );
  }

  if (!sessionEmail) {
    return (
      <div className="cursor-auto min-h-screen bg-[#fbf7ef] flex items-center justify-center p-8">
        <div className="rounded-2xl border border-black/10 bg-white/50 backdrop-blur px-6 py-6 max-w-xl mx-auto w-full">
          <h1 className="font-mono text-lg lowercase">Admin</h1>
          <p className="font-mono text-sm opacity-70 mt-2">Log in to continue.</p>
          <form onSubmit={handleLogin} className="mt-6 space-y-4 text-left">
            <div>
              <label className="block text-xs font-mono opacity-70 lowercase mb-1">Email</label>
              <input
                type="email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full rounded-xl border border-black/15 bg-white/60 px-3 py-2 font-mono text-sm outline-none focus:border-black/30"
              />
            </div>
            <div>
              <label className="block text-xs font-mono opacity-70 lowercase mb-1">Password</label>
              <input
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="w-full rounded-xl border border-black/15 bg-white/60 px-3 py-2 font-mono text-sm outline-none focus:border-black/30"
              />
            </div>
            <button
              type="submit"
              disabled={loginLoading}
              className="rounded-xl border border-black/20 bg-black text-[#fbf7ef] px-4 py-2 font-mono text-sm hover:bg-black/90 disabled:opacity-50"
            >
              {loginLoading ? "Logging in…" : "Log in"}
            </button>
            {loginError && (
              <p className="font-mono text-sm text-red-600 mt-2">{loginError}</p>
            )}
          </form>
        </div>
      </div>
    );
  }

  if (sessionEmail !== ADMIN_EMAIL) {
    return (
      <div className="cursor-auto min-h-screen bg-[#fbf7ef] flex items-center justify-center p-8">
        <div className="rounded-2xl border border-black/10 bg-white/50 backdrop-blur px-6 py-6 max-w-xl mx-auto text-center">
          <h1 className="font-mono text-lg lowercase">Admin</h1>
          <p className="font-mono text-sm opacity-70 mt-2">Not authorized.</p>
          <button
            type="button"
            onClick={signOut}
            className="rounded-xl border border-black/20 bg-transparent px-4 py-2 font-mono text-sm hover:bg-black/5 mt-3"
          >
            Sign out
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="cursor-auto min-h-screen bg-[#fbf7ef] py-12 px-4">
      <div className="max-w-xl mx-auto" onKeyDown={handleKeyDown}>
        <div className="rounded-2xl border border-black/10 bg-white/50 backdrop-blur px-6 py-6">
          <h1 className="font-mono text-lg lowercase">Admin</h1>
          <p className="font-mono text-xs opacity-70 lowercase mt-1">Logged in as {sessionEmail}</p>

          <div className="mt-6 space-y-4">
            <div>
              <label className="block text-xs font-mono opacity-70 lowercase mb-1">Title (required)</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-xl border border-black/15 bg-white/60 px-3 py-2 font-mono text-sm outline-none focus:border-black/30"
              />
            </div>

            <div>
              <label className="block text-xs font-mono opacity-70 lowercase mb-1">Date (required)</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-xl border border-black/15 bg-white/60 px-3 py-2 font-mono text-sm outline-none focus:border-black/30"
              />
            </div>

            <div>
              <label className="block text-xs font-mono opacity-70 lowercase mb-1">Content (required)</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-[300px] w-full resize-y rounded-xl border border-black/15 bg-white/60 px-3 py-2 font-mono text-sm outline-none focus:border-black/30"
              />
            </div>

            <div>
              <label className="block text-xs font-mono opacity-70 lowercase mb-1">Images (optional)</label>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
                className="w-full rounded-xl border border-black/15 bg-white/60 px-3 py-2 font-mono text-sm outline-none focus:border-black/30 file:mr-2 file:rounded-lg file:border-0 file:bg-black/10 file:px-3 file:py-1 file:font-mono file:text-sm"
              />
              {files.length > 0 && (
                <ul className="mt-2 font-mono text-xs opacity-70 lowercase list-disc list-inside">
                  {files.map((f, i) => (
                    <li key={i}>{f.name}</li>
                  ))}
                </ul>
              )}
            </div>

            <div className="pt-2 flex flex-wrap gap-3 items-center">
              <button
                type="button"
                onClick={() => insertThought()}
                disabled={saving}
                className="rounded-xl border border-black/20 bg-black text-[#fbf7ef] px-4 py-2 font-mono text-sm hover:bg-black/90 disabled:opacity-50"
              >
                Insert thought
              </button>
              <button
                type="button"
                onClick={signOut}
                className="rounded-xl border border-black/20 bg-transparent px-4 py-2 font-mono text-sm hover:bg-black/5"
              >
                Sign out
              </button>
              <span className="font-mono text-xs opacity-70 lowercase">
                {saving ? (files.length > 0 ? "Uploading…" : "saving...") : successMessage === "Saved." ? "saved" : ""}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-10 rounded-2xl border border-black/10 bg-white/50 backdrop-blur px-6 py-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-mono text-lg lowercase">Manage thoughts</h2>
            <button
              type="button"
              onClick={() => fetchThoughts()}
              disabled={listLoading}
              className="rounded-xl border border-black/20 bg-transparent px-3 py-1.5 font-mono text-xs hover:bg-black/5 disabled:opacity-50"
            >
              Refresh
            </button>
          </div>

          {editingId != null && (
            <div className="mt-4 rounded-xl border border-black/15 bg-white/70 p-4 space-y-3">
              <p className="font-mono text-xs opacity-70 lowercase">Editing thought {editingId}</p>
              <div>
                <label className="block text-xs font-mono opacity-70 lowercase mb-1">Title</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full rounded-xl border border-black/15 bg-white/60 px-3 py-2 font-mono text-sm outline-none focus:border-black/30"
                />
              </div>
              <div>
                <label className="block text-xs font-mono opacity-70 lowercase mb-1">Date</label>
                <input
                  type="date"
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  className="w-full rounded-xl border border-black/15 bg-white/60 px-3 py-2 font-mono text-sm outline-none focus:border-black/30"
                />
              </div>
              <div>
                <label className="block text-xs font-mono opacity-70 lowercase mb-1">Content</label>
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  rows={4}
                  className="w-full rounded-xl border border-black/15 bg-white/60 px-3 py-2 font-mono text-sm outline-none focus:border-black/30 resize-y"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => saveEdit()}
                  className="rounded-xl border border-black/20 bg-black text-[#fbf7ef] px-4 py-2 font-mono text-sm hover:bg-black/90"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => cancelEdit()}
                  className="rounded-xl border border-black/20 bg-transparent px-4 py-2 font-mono text-sm hover:bg-black/5"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div className="mt-4">
            {listLoading ? (
              <p className="font-mono text-xs opacity-70">Loading list…</p>
            ) : thoughts.length === 0 ? (
              <p className="font-mono text-xs opacity-70">No thoughts yet.</p>
            ) : (
              <ul className="space-y-2">
                {thoughts.map((t) => {
                  const preview = (t.content ?? "").slice(0, 80);
                  const previewStr = preview.length < (t.content ?? "").length ? preview + "…" : preview;
                  return (
                    <li
                      key={t.id}
                      className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-xl border border-black/10 bg-white/60 px-3 py-2 font-mono text-sm"
                    >
                      <span className="opacity-70">#{t.id}</span>
                      <span className="min-w-0 truncate">{t.title || "(untitled)"}</span>
                      <span className="opacity-70">{t.date ?? "—"}</span>
                      <span className="w-full min-w-0 truncate opacity-70 text-xs">{previewStr || "—"}</span>
                      <div className="flex gap-2 ml-auto">
                        <button
                          type="button"
                          onClick={() => startEdit(t)}
                          className="rounded-lg border border-black/20 bg-transparent px-2 py-1 font-mono text-xs hover:bg-black/5"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteThought(t.id)}
                          className="rounded-lg border border-black/20 bg-transparent px-2 py-1 font-mono text-xs hover:bg-black/5 text-red-700"
                        >
                          Delete
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        {/* Newsletter section */}
        <div className="mt-10 rounded-2xl border border-black/10 bg-white/50 backdrop-blur px-6 py-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-mono text-lg lowercase">Newsletter</h2>
            <span className="font-mono text-xs opacity-50">
              {subscriberCount !== null
                ? `${subscriberCount} subscriber${subscriberCount !== 1 ? "s" : ""}`
                : ""}
            </span>
          </div>
          <div className="mt-4 space-y-4">
            <div>
              <label className="block text-xs font-mono opacity-70 lowercase mb-1">Thought to send</label>
              <select
                value={newsletterThoughtId ?? ""}
                onChange={(e) =>
                  setNewsletterThoughtId(
                    e.target.value === "" ? null : parseInt(e.target.value, 10)
                  )
                }
                className="w-full rounded-xl border border-black/15 bg-white/60 px-3 py-2 font-mono text-sm outline-none focus:border-black/30"
              >
                <option value="">Most recent</option>
                {thoughts.map((t) => (
                  <option key={t.id} value={t.id}>
                    #{t.id} — {t.title ?? "(untitled)"} ({t.date ?? "no date"})
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-wrap gap-3 items-center">
              <button
                type="button"
                onClick={sendNewsletter}
                disabled={sendingNewsletter || thoughts.length === 0}
                className="rounded-xl border border-black/20 bg-black text-[#fbf7ef] px-4 py-2 font-mono text-sm hover:bg-black/90 disabled:opacity-50"
              >
                {sendingNewsletter ? "Sending…" : "Send newsletter"}
              </button>
              {newsletterMessage && (
                <span className="font-mono text-xs opacity-70 lowercase">{newsletterMessage}</span>
              )}
            </div>
          </div>
        </div>

        {/* Beliefs section — backgrounds from /public/beliefs, auto-assigned on insert */}
        <div className="mt-10 border-t border-black/10 pt-10">
          <h2 className="font-mono text-lg lowercase">Beliefs</h2>

          <div className="mt-6 space-y-4">
            <div>
              <label className="block text-xs font-mono opacity-70 lowercase mb-1">Content (required)</label>
              <textarea
                value={beliefText}
                onChange={(e) => setBeliefText(e.target.value)}
                rows={5}
                className="min-h-[120px] w-full resize-y rounded-xl border border-black/15 bg-white/60 px-3 py-2 font-mono text-sm outline-none focus:border-black/30"
              />
            </div>
            <div>
              <label className="block text-xs font-mono opacity-70 lowercase mb-1">Background image</label>
              <select
                value={beliefBgChoice ?? ""}
                onChange={(e) => setBeliefBgChoice(e.target.value === "" ? null : parseInt(e.target.value, 10))}
                className="w-full rounded-xl border border-black/15 bg-white/60 px-3 py-2 font-mono text-sm outline-none focus:border-black/30"
              >
                <option value="">Auto (assign automatically)</option>
                {Array.from({ length: BELIEF_BG_COUNT }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n}>
                    belief{String(n).padStart(2, "0")}.jpg
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-wrap gap-3 items-center">
              <button
                type="button"
                onClick={() => insertBelief()}
                disabled={savingBelief}
                className="rounded-xl border border-black/20 bg-black text-[#fbf7ef] px-4 py-2 font-mono text-sm hover:bg-black/90 disabled:opacity-50"
              >
                Insert belief
              </button>
              <span className="font-mono text-xs opacity-70 lowercase">
                {savingBelief ? "saving..." : beliefSuccessMessage === "Saved." ? "saved" : ""}
              </span>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-black/10 bg-white/50 backdrop-blur px-6 py-6">
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-mono text-sm lowercase">Manage beliefs</h3>
              <button
                type="button"
                onClick={() => fetchBeliefs()}
                disabled={beliefsListLoading}
                className="rounded-xl border border-black/20 bg-transparent px-3 py-1.5 font-mono text-xs hover:bg-black/5 disabled:opacity-50"
              >
                Refresh
              </button>
            </div>

            {editingBeliefId != null && (
              <div className="mt-4 rounded-xl border border-black/15 bg-white/70 p-4 space-y-3">
                <p className="font-mono text-xs opacity-70 lowercase">Editing belief {editingBeliefId}</p>
                <div>
                  <label className="block text-xs font-mono opacity-70 lowercase mb-1">Content</label>
                  <textarea
                    value={editBeliefText}
                    onChange={(e) => setEditBeliefText(e.target.value)}
                    rows={4}
                    className="w-full rounded-xl border border-black/15 bg-white/60 px-3 py-2 font-mono text-sm outline-none focus:border-black/30 resize-y"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono opacity-70 lowercase mb-1">Background image</label>
                  <select
                    value={editBeliefBgChoice ?? ""}
                    onChange={(e) => setEditBeliefBgChoice(e.target.value === "" ? null : parseInt(e.target.value, 10))}
                    className="w-full rounded-xl border border-black/15 bg-white/60 px-3 py-2 font-mono text-sm outline-none focus:border-black/30"
                  >
                    <option value="">Keep current</option>
                    {Array.from({ length: BELIEF_BG_COUNT }, (_, i) => i + 1).map((n) => (
                      <option key={n} value={n}>
                        belief{String(n).padStart(2, "0")}.jpg
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => saveEditBelief()}
                    className="rounded-xl border border-black/20 bg-black text-[#fbf7ef] px-4 py-2 font-mono text-sm hover:bg-black/90"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => cancelEditBelief()}
                    className="rounded-xl border border-black/20 bg-transparent px-4 py-2 font-mono text-sm hover:bg-black/5"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            <div className="mt-4">
              {beliefsListLoading ? (
                <p className="font-mono text-xs opacity-70">Loading list…</p>
              ) : beliefTableMissing ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 font-mono text-sm text-amber-900">
                  <p className="font-medium">Beliefs table not set up</p>
                  <p className="mt-1 opacity-90">Run migrations to create it:</p>
                  <code className="mt-2 block rounded bg-amber-100 px-2 py-1.5 text-xs">npx supabase db push</code>
                  <p className="mt-2 text-xs opacity-80">Then click Refresh.</p>
                </div>
              ) : beliefs.length === 0 ? (
                <p className="font-mono text-xs opacity-70">No beliefs yet.</p>
              ) : (
                <ul className="space-y-2">
                  {beliefs.map((b) => {
                    const preview = b.content.slice(0, 80);
                    const previewStr = preview.length < b.content.length ? preview + "…" : preview;
                    return (
                      <li
                        key={b.id}
                        className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-xl border border-black/10 bg-white/60 px-3 py-2 font-mono text-sm"
                      >
                        <span className="opacity-70">#{b.id}</span>
                        <span className="min-w-0 truncate max-w-[280px] opacity-80 text-xs">{previewStr || "—"}</span>
                        <span className="opacity-60 text-xs">bg {b.bg_index}</span>
                        <div className="flex gap-2 ml-auto">
                          <button
                            type="button"
                            onClick={() => startEditBelief(b)}
                            className="rounded-lg border border-black/20 bg-transparent px-2 py-1 font-mono text-xs hover:bg-black/5"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteBelief(b.id)}
                            className="rounded-lg border border-black/20 bg-transparent px-2 py-1 font-mono text-xs hover:bg-black/5 text-red-700"
                          >
                            Delete
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
