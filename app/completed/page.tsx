"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type GameToken = {
  status: "playing" | "completed";
  startTime: number;
  completedAt?: number;
  moves?: number;
};

const STORAGE_KEY = "hanoiStatus";

export default function CompletedPage() {
  const [token, setToken] = useState<GameToken | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      router.replace("/");
      return;
    }
    try {
      const parsed = JSON.parse(raw) as GameToken;
      if (parsed.status !== "completed") {
        router.replace("/");
        return;
      }
      setToken(parsed);
    } catch (err) {
      console.error("Bad token", err);
      router.replace("/");
    }
  }, [router]);

  const duration = useMemo(() => {
    if (!token?.completedAt || !token?.startTime) return null;
    const diff = token.completedAt - token.startTime;
    const totalSeconds = Math.max(0, Math.floor(diff / 1000));
    const h = Math.floor(totalSeconds / 3600)
      .toString()
      .padStart(2, "0");
    const m = Math.floor((totalSeconds % 3600) / 60)
      .toString()
      .padStart(2, "0");
    const s = Math.floor(totalSeconds % 60)
      .toString()
      .padStart(2, "0");
    return `${h}:${m}:${s}`;
  }, [token]);

  return (
    <div className="w-full max-w-xl rounded-3xl px-8 py-10 text-center">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-400/20 text-4xl">
        🎉
      </div>
      <h1
        className="text-3xl font-bold text-slate-50"
        style={{ fontFamily: "var(--font-bungee)" }}
      >
        You have successfully completed the game
      </h1>
      <div className="flex items-center w-full mt-6 gap-10 text-lg text-slate-100">
        <p className="glass-card rounded-sm w-fit px-5">
          Time taken:{" "}
          <span className="font-semibold">{duration ?? "Just now"}</span>
        </p>
        <p className="glass-card rounded-sm w-fit px-5">
          No of Moves:{" "}
          <span className="font-semibold">{token?.moves ?? 0}</span>
        </p>
      </div>
    </div>
  );
}

