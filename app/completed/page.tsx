"use client";

import { Suspense, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function CompletedContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const disks = useMemo(() => parseInt(searchParams.get("disks") || "5", 10), [searchParams]);
  const mode = useMemo(() => searchParams.get("mode") || "zen", [searchParams]);
  const limit = useMemo(() => searchParams.get("limit") || "2", [searchParams]);
  const moves = useMemo(() => parseInt(searchParams.get("moves") || "0", 10), [searchParams]);
  const elapsed = useMemo(() => parseInt(searchParams.get("elapsed") || "0", 10), [searchParams]);

  const duration = useMemo(() => {
    if (!elapsed) return "00:00:00";
    const totalSeconds = Math.max(0, Math.floor(elapsed / 1000));
    const h = Math.floor(totalSeconds / 3600).toString().padStart(2, "0");
    const m = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, "0");
    const s = Math.floor(totalSeconds % 60).toString().padStart(2, "0");
    return `${h}:${m}:${s}`;
  }, [elapsed]);

  const minMoves = useMemo(() => {
    return Math.pow(2, disks) - 1;
  }, [disks]);

  const handlePlayAgain = () => {
    router.push("/");
  };

  const handleRetrySame = () => {
    router.push(`/game?disks=${disks}&mode=${mode}&limit=${limit}`);
  };

  return (
    <div className="w-full max-w-2xl rounded-3xl glass-card px-6 py-4 sm:px-10 text-center animate-fade-in my-8">
      <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-500/20 text-5xl shadow-[0_0_20px_rgba(34,197,94,0.3)]">
        🎉
      </div>
      <h1
        className="text-xl sm:text-4xl font-bold text-slate-50 tracking-wide"
        style={{ fontFamily: "var(--font-bungee)" }}
      >
        Puzzle Solved!
      </h1>
      <p className="text-sm md:text-lg mt-3 text-slate-300">
        You successfully moved the stack of <span className="font-bold text-sky-400">{disks}</span> disks in{" "}
        <span className="font-bold text-sky-400 capitalize">{mode} Mode</span>.
      </p>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-2 sm:gap-4 mt-2 md:mt-8">
        {/* Moves Card */}
        <div className="glass-strong rounded-2xl p-2 sm:p-4 flex flex-col justify-between">
          <div>
            <div className="text-xs md:text-sm font-semibold uppercase text-slate-400">Total Moves</div>
            <div className="text-md md:text-4xl font-black text-slate-100 mt-2">{moves}</div>
          </div>
          <div className="text-xs text-slate-400 border-t pt-2 border-white/5">
            <p>Perfect Solve:</p> 
            <p className="font-semibold text-emerald-400">{minMoves} moves</p>
          </div>
        </div>

        {/* Time Card */}
        <div className="glass-strong rounded-2xl p-2 sm:p-4 flex flex-col justify-between">
          <div>
            <div className="text-xs md:text-sm font-semibold uppercase text-slate-400">Time Taken</div>
            <div className="text-md md:text-4xl font-black text-slate-100 mt-2">{duration}</div>
          </div>
          <div className="text-xs text-slate-400 border-t pt-2 border-white/5">
            <p>Format:</p> 
            <p className="font-semibold text-slate-300">HH:MM:SS</p>
          </div>
        </div>
      </div>

      <div className="mt-10 flex gap-4 justify-center">
        <button
          onClick={handlePlayAgain}
          className="w-1/2 rounded-full px-2 md:px-6 py-2 md:py-4 font-semibold hover:scale-[1.02] transition-all cursor-pointer text-sm md:text-lg shadow-lg border border-slate-500 hover:bg-white/5 text-slate-200 hover:border-white "
        >
          Main Menu
        </button>
        <button
          onClick={handleRetrySame}
          className="w-1/2 rounded-full px-2 md:px-6 py-2 md:py-4 font-semibold hover:scale-[1.02] transition-all cursor-pointer text-sm md:text-lg shadow-lg bg-white hover:bg-slate-200 text-slate-950"
        >
          Play Again
        </button>
      </div>
    </div>
  );
}

export default function CompletedPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-[300px] text-slate-300">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mb-4"></div>
        <p className="text-sm">Loading results...</p>
      </div>
    }>
      <CompletedContent />
    </Suspense>
  );
}

