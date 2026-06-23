"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { TowerRules } from "./shared/rules";

export default function Home() {
  const [showRules, setShowRules] = useState(false);
  const [diskCount, setDiskCount] = useState(5);
  const [gameMode, setGameMode] = useState<"zen" | "timed">("zen");
  const [timeLimit, setTimeLimit] = useState(2); // in minutes
  const router = useRouter();

  const ruleContent = useMemo(
    () => ({
      title: "Game Rules",
      intro:
        "Before you begin, make sure you follow the official rules for this Tower of Hanoi challenge.",
      bullets: [
        `The game begins with all ${diskCount} disks stacked on the 1st peg.`,
        "Your goal is to move the entire stack to the 3rd peg following classic Tower of Hanoi rules.",
        "Only one disk can be moved at a time.",
        "Each move takes the upper disk from a stack and places it on another peg.",
        "No larger disk may ever sit on top of a smaller disk.",
        gameMode === "timed"
          ? `Time limit for this game is ${timeLimit} minute${timeLimit > 1 ? "s" : ""}. After the time runs out, the board resets.`
          : "Zen Mode: Play at your own pace with no time limit.",
      ],
    }),
    [diskCount, gameMode, timeLimit]
  );

  const startGame = () => {
    router.push(
      `/game?disks=${diskCount}&mode=${gameMode}&limit=${timeLimit}`
    );
  };

  return (
    <div className="flex w-full max-w-4xl flex-col items-center justify-center animate-fade-in">
      {!showRules ? (
        <div className="glass-card w-full max-w-lg rounded-3xl px-6 py-2 sm:px-8 sm:py-4 text-center shadow-2xl">
          <h1
            className="text-3xl sm:text-4xl font-extrabold tracking-wide text-slate-50 drop-shadow-md"
            style={{ fontFamily: "var(--font-bungee)" }}
          >
            Tower of Hanoi
          </h1>
          <p className="mt-1.5 text-xs sm:text-sm text-slate-300">
            Conquer the classic mathematical puzzle. Stack, solve, and replay.
          </p>

          {/* Difficulty Selection */}
          <div className="mt-5 text-left">
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                1. Choose Number of Disks
              </label>
              <span className="text-xs font-bold text-sky-400 bg-sky-500/10 px-2.5 py-0.5 rounded-full border border-sky-500/20">
                {diskCount} Disks ({Math.pow(2, diskCount) - 1} min moves)
              </span>
            </div>
            <div className="flex gap-1.5">
              {[3, 4, 5, 6, 7, 8].map((n) => (
                <button
                  key={n}
                  onClick={() => setDiskCount(n)}
                  className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all duration-200 cursor-pointer ${
                    diskCount === n
                      ? "bg-sky-500 text-slate-900 shadow-[0_0_12px_rgba(56,189,248,0.4)] scale-105"
                      : "bg-white/5 text-slate-300 hover:bg-white/10"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* Mode & Timer Selection Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5 text-left">
            {/* Mode Selection */}
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                2. Game Mode
              </label>
              <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
                <button
                  onClick={() => setGameMode("zen")}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer ${
                    gameMode === "zen"
                      ? "bg-emerald-500 text-slate-950 shadow-[0_0_10px_rgba(16,185,129,0.3)]"
                      : "text-slate-300 hover:text-white"
                  }`}
                >
                  🧘 Zen
                </button>
                <button
                  onClick={() => setGameMode("timed")}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer ${
                    gameMode === "timed"
                      ? "bg-amber-500 text-slate-950 shadow-[0_0_10px_rgba(245,158,11,0.3)]"
                      : "text-slate-300 hover:text-white"
                  }`}
                >
                  ⏳ Timed
                </button>
              </div>
            </div>

            {/* Time Limit Selector */}
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                3. Time Limit
              </label>
              {gameMode === "timed" ? (
                <select
                  value={timeLimit}
                  onChange={(e) => setTimeLimit(parseInt(e.target.value, 10))}
                  className="w-full bg-white/5 border border-white/10 text-slate-300 rounded-xl px-3 py-1.5 text-xs font-semibold outline-none hover:bg-white/10 focus:border-amber-500 transition-all cursor-pointer h-9"
                >
                  {[1, 2, 3, 5, 10].map((m) => (
                    <option key={m} value={m} className="bg-slate-950 text-slate-100">
                      {m} Minute{m > 1 ? "s" : ""}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="flex items-center justify-center w-full bg-white/5 border border-white/10 text-slate-500 rounded-xl px-3 py-1.5 text-[11px] font-medium h-9 select-none">
                  No limit (Play free)
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <button
              onClick={() => setShowRules(true)}
              className="w-1/3 rounded-full border border-slate-600 py-3 font-semibold text-sm text-slate-200 hover:bg-white/5 hover:border-slate-400 transition-all cursor-pointer"
            >
              Rules
            </button>
            <button
              onClick={startGame}
              className="w-2/3 rounded-full bg-white py-3 font-bold text-sm text-slate-950 transition hover:bg-slate-200 hover:scale-[1.01] cursor-pointer shadow-lg"
            >
              Start Game
            </button>
          </div>
        </div>
      ) : (
        <div className="glass-card w-full max-w-xl rounded-3xl px-6 py-2 sm:px-8 sm:py-4 max-h-[100dvh] flex flex-col justify-between shadow-2xl">
          <div className="overflow-y-auto pr-1 max-h-[75vh]">
            <TowerRules content={ruleContent} />
          </div>
          <div className="mt-6 flex gap-3 border-t border-white/10 pt-4">
            <button
              onClick={() => setShowRules(false)}
              className="w-1/2 rounded-full border border-slate-600 py-3 font-semibold text-sm text-slate-200 transition hover:bg-white/5 cursor-pointer"
            >
              Back
            </button>
            <button
              onClick={startGame}
              className="w-1/2 rounded-full bg-white py-3 font-bold text-sm text-slate-900 transition hover:bg-slate-200 cursor-pointer"
            >
              Begin
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
