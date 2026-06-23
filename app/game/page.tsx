"use client";

import { useCallback, useEffect, useMemo, useRef, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { TowerRules } from "../shared/rules";

type PegState = [number[], number[], number[]];

const DISK_COLORS = [
  "#a855f7", // purple
  "#3b82f6", // blue
  "#06b6d4", // cyan
  "#10b981", // green
  "#eab308", // yellow
  "#f97316", // orange
  "#ef4444", // red
  "#ec4899", // pink
];

function GameContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Settings from query params
  const diskCount = useMemo(() => {
    const d = parseInt(searchParams.get("disks") || "5", 10);
    return isNaN(d) || d < 3 || d > 8 ? 5 : d;
  }, [searchParams]);

  const gameMode = useMemo(() => {
    const m = searchParams.get("mode");
    return m === "timed" ? "timed" : "zen";
  }, [searchParams]);

  const limitMinutes = useMemo(() => {
    const l = parseInt(searchParams.get("limit") || "2", 10);
    return isNaN(l) || l < 1 ? 2 : l;
  }, [searchParams]);

  // Initial peg layout based on disk count
  const initialPegs = useMemo(() => {
    return [
      Array.from({ length: diskCount }, (_, i) => diskCount - 1 - i),
      [],
      [],
    ] as PegState;
  }, [diskCount]);

  const [pegs, setPegs] = useState<PegState>(initialPegs);
  const [selected, setSelected] = useState<number | null>(null);
  const [moves, setMoves] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [invalidPeg, setInvalidPeg] = useState<number | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [confirmMainMenu, setConfirmMainMenu] = useState(false);
  const [showTimeoutReset, setShowTimeoutReset] = useState(false);
  const [waitingForEnter, setWaitingForEnter] = useState(false);
  const [showRulesModal, setShowRulesModal] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Sync state if diskCount changes
  useEffect(() => {
    setPegs(initialPegs);
    setMoves(0);
    setSelected(null);
    setElapsed(0);
    setStartTime(Date.now());
    setShowTimeoutReset(false);
    setWaitingForEnter(false);
  }, [initialPegs]);

  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleTimeoutReset = useCallback(() => {
    // Stop the timer
    timerRef.current && clearInterval(timerRef.current);
    // Reset game state
    setPegs(initialPegs);
    setMoves(0);
    setSelected(null);
    setElapsed(0);
    setStartTime(null);
    // Show popup
    setShowTimeoutReset(true);
    setWaitingForEnter(true);
  }, [initialPegs]);

  // Timer Effect
  useEffect(() => {
    if (!startTime || waitingForEnter) return;
    timerRef.current && clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      const newElapsed = Date.now() - startTime;
      setElapsed(newElapsed);
      // Check if limit has passed in timed mode
      if (gameMode === "timed" && newElapsed >= limitMinutes * 60 * 1000) {
        handleTimeoutReset();
      }
    }, 250);
    return () => {
      timerRef.current && clearInterval(timerRef.current);
    };
  }, [startTime, waitingForEnter, gameMode, limitMinutes, handleTimeoutReset]);

  // Format Timer Label
  const timeLabel = useMemo(() => {
    const ms = gameMode === "timed"
      ? Math.max(0, limitMinutes * 60 * 1000 - elapsed)
      : elapsed;
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, "0");
    const seconds = Math.floor(totalSeconds % 60).toString().padStart(2, "0");
    
    if (gameMode === "timed") {
      return `${minutes}:${seconds}`;
    } else {
      const hours = Math.floor(totalSeconds / 3600).toString().padStart(2, "0");
      const m = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, "0");
      return `${hours}:${m}:${seconds}`;
    }
  }, [elapsed, gameMode, limitMinutes]);

  const rulesContent = useMemo(
    () => ({
      title: "How to Play",
      bullets: [
        "Click the top disk of any peg to lift it.",
        "Click another peg to place the lifted disk.",
        "You cannot place a larger disk on a smaller one.",
        "Only one disk can be moved at a time.",
        "Move the entire stack to the rightmost peg to win!",
      ],
    }),
    []
  );

  const moveDisk = (from: number, to: number) => {
    setPegs((prev) => {
      const updated: PegState = [
        [...prev[0]],
        [...prev[1]],
        [...prev[2]],
      ];
      if (updated[from].length === 0) return prev;
      const disk = updated[from].pop()!;
      
      const targetTop = updated[to].length > 0 ? updated[to][updated[to].length - 1] : undefined;
      if (targetTop !== undefined && targetTop < disk) {
        setInvalidPeg(to);
        setTimeout(() => setInvalidPeg(null), 300);
        updated[from].push(disk); // Put it back
        return prev;
      }

      updated[to].push(disk);
      const nextMoves = moves + 1;
      setMoves(nextMoves);

      // Win condition: check if peg 2 has all disks in correct order
      const didWin = updated[2].length === diskCount && updated[2].every((v, i) => v === diskCount - 1 - i);
      if (didWin) {
        const timeTaken = Date.now() - (startTime ?? Date.now());
        setTimeout(() => {
          router.push(`/completed?disks=${diskCount}&mode=${gameMode}&limit=${limitMinutes}&moves=${nextMoves}&elapsed=${timeTaken}`);
        }, 350);
      }
      return updated;
    });
    setSelected(null);
  };

  const handlePegClick = (index: number) => {
    if (selected === null) {
      if (pegs[index].length === 0) return;
      setSelected(index);
      return;
    }
    if (selected === index) {
      setSelected(null);
      return;
    }
    const sourceMin = pegs[selected].length > 0 ? pegs[selected][pegs[selected].length - 1] : undefined;
    const targetMin = pegs[index].length > 0 ? pegs[index][pegs[index].length - 1] : undefined;
    if (sourceMin === undefined) {
      setSelected(null);
      return;
    }
    if (targetMin !== undefined && targetMin < sourceMin) {
      setInvalidPeg(index);
      setTimeout(() => setInvalidPeg(null), 300);
      return;
    }
    moveDisk(selected, index);
  };

  const handleDragStart = (pegIdx: number) => {
    if (pegs[pegIdx].length === 0) return false;
    setSelected(pegIdx);
    return true;
  };

  const handleDrop = (pegIdx: number) => {
    if (selected === null) return;
    handlePegClick(pegIdx);
  };

  const confirmRestart = () => {
    setConfirmReset(false);
    setPegs(initialPegs);
    setMoves(0);
    setSelected(null);
    setElapsed(0);
    setStartTime(Date.now());
  };

  const startNextAttempt = useCallback(() => {
    setPegs(initialPegs);
    setMoves(0);
    setSelected(null);
    setElapsed(0);
    setStartTime(Date.now());
    setShowTimeoutReset(false);
    setWaitingForEnter(false);
  }, [initialPegs]);

  // Handle Enter key press to start next attempt
  useEffect(() => {
    if (!waitingForEnter) return;

    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        startNextAttempt();
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => {
      window.removeEventListener("keydown", handleKeyPress);
    };
  }, [waitingForEnter, startNextAttempt]);

  return (
    <div className="flex flex-col lg:flex-row w-full max-w-6xl max-h-[100dvh] items-center justify-center gap-6 px-4">
      {/* Left Sidebar for Desktop Rules */}
      <aside className="hidden lg:block w-1/4 max-w-xs">
        <div className="glass-card rounded-3xl p-6 shadow-xl">
          <TowerRules content={rulesContent} />
        </div>
      </aside>

      {/* Main Game Area */}
      <div className="flex-1 w-full max-w-3xl flex flex-col py-4 gap-3 md:gap-6">
        {/* Game Header / Dashboard */}
        <div className="flex flex-wrap items-center justify-between gap-4 px-4 py-3 glass-card rounded-2xl shadow-lg border border-white/10">
          <div className="flex flex-col">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              {gameMode === "timed" ? "⏳ Timed Challenge" : "🧘 Zen Mode"}
            </span>
            <span className="text-sm font-bold text-slate-200">
              {diskCount} Disks Puzzle
            </span>
          </div>

          <div className="flex flex-col md:flex-row items-center gap-3">
            <div className="flex items-center gap-3">
              <div className="bg-white/5 rounded-xl px-4 py-2 border border-white/5 shadow-inner text-center">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  {gameMode === "timed" ? "Remaining" : "Elapsed"}
                </div>
                <div className="text-sm md:text-lg font-bold font-mono text-slate-100 min-w-[70px]">{timeLabel}</div>
              </div>

              <div className="bg-white/5 rounded-xl px-4 py-2 border border-white/5 shadow-inner text-center">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Moves</div>
                <div className="text-sm md:text-lg font-bold text-slate-100">{moves}</div>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={() => setShowRulesModal(true)}
                className="rounded-xl px-2.5 sm:px-3 py-2 font-semibold text-xs sm:text-sm transition hover:bg-slate-800 cursor-pointer hover:scale-[1.02] lg:hidden border border-slate-600 text-slate-200"
              >
                Rules
              </button>

              <button
                onClick={() => setConfirmMainMenu(true)}
                className="rounded-xl px-2.5 sm:px-3 py-2 font-semibold text-xs sm:text-sm transition hover:bg-white/5 cursor-pointer hover:scale-[1.02] border border-slate-600 text-slate-200"
              >
                Menu
              </button>

              <button
                onClick={() => setConfirmReset(true)}
                className="rounded-xl px-2.5 sm:px-3 py-2 font-semibold text-xs sm:text-sm transition hover:bg-slate-200 cursor-pointer hover:scale-[1.02] bg-white text-slate-950"
              >
                Restart
              </button>
            </div>
          </div>
        </div>

        {/* Game Board Container */}
        <div className="flex-1 glass-card relative rounded-3xl p-2 sm:p-4 shadow-2xl border border-white/10">
          <h2
            className="mb-8 text-2xl sm:text-3xl font-extrabold text-slate-50 text-center tracking-wide"
            style={{ fontFamily: "var(--font-bungee)" }}
          >
            Tower Board
          </h2>

          <div className="relative flex h-[200px] sm:h-[250px] lg:h-[350px] items-end justify-between gap-3 sm:gap-6 px-2 sm:px-4">
            {pegs.map((peg, pegIdx) => {
              const isValidDestination = selected !== null && selected !== pegIdx && (
                pegs[pegIdx].length === 0 || 
                pegs[pegIdx][pegs[pegIdx].length - 1] > pegs[selected][pegs[selected].length - 1]
              );

              return (
                <div
                  key={pegIdx}
                  className={`group relative flex h-full cursor-pointer rounded-2xl py-4 w-1/3 flex-col items-center justify-end transition-all duration-300 border ${
                    invalidPeg === pegIdx 
                      ? "peg-invalid border-red-500 bg-red-500/10 shadow-[0_0_15px_rgba(239,68,68,0.2)]" 
                      : selected === pegIdx 
                      ? "border-sky-400 ring-4 ring-sky-400/20 shadow-[0_0_20px_rgba(56,189,248,0.3)] bg-white/10" 
                      : isValidDestination
                      ? "border-emerald-500/40 bg-emerald-500/5 hover:border-emerald-400 hover:bg-emerald-500/10 shadow-[0_0_10px_rgba(16,185,129,0.1)]"
                      : "border-white/5 bg-white/5 hover:border-white/10 hover:bg-white/8"
                  }`}
                  onClick={() => handlePegClick(pegIdx)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    handleDrop(pegIdx);
                  }}
                >
                  {/* Rod (Vertical Column) */}
                  <div className="absolute bottom-4 top-4 left-1/2 -translate-x-1/2 w-2.5 rounded-full bg-gradient-to-b from-slate-400 via-slate-200 to-slate-500 shadow-inner group-hover:brightness-110 transition-all duration-300" />
                  
                  {/* Disks Container */}
                  <div className={`relative z-10 flex w-full flex-col items-center justify-end pb-2 ${
                    diskCount >= 7 
                      ? "gap-0.5 sm:gap-1" 
                      : diskCount === 6 
                      ? "gap-1 sm:gap-1.5" 
                      : "gap-1.5 sm:gap-2"
                  }`}>
                    {peg.slice().reverse().map((diskIndex, reverseIdx) => {
                      const actualIdx = peg.length - 1 - reverseIdx;
                      const minWidth = isMobile ? 40 : 25;
                      const maxWidth = isMobile ? 98 : 95;
                      const widthPercent = diskCount > 1
                        ? minWidth + (diskIndex * ((maxWidth - minWidth) / (diskCount - 1)))
                        : maxWidth;
                      const isTop = actualIdx === peg.length - 1;
                      const heightClass = diskCount >= 7 ? "h-3 sm:h-7" : diskCount === 6 ? "h-4 sm:h-8" : "h-5 sm:h-9";
                      return (
                        <div
                          key={`${pegIdx}-${diskIndex}`}
                          draggable={isTop}
                          onDragStart={(e) => {
                            const allowed = handleDragStart(pegIdx);
                            if (!allowed) e.preventDefault();
                          }}
                          className={`relative rounded-full text-center shadow-md border border-white/20 transition-all duration-300 ease-out cursor-pointer hover:brightness-110 ${heightClass} ${
                            isTop && selected === pegIdx
                              ? "-translate-y-6 scale-[1.03] shadow-[0_15px_25px_rgba(0,0,0,0.5)] ring-2 ring-white/40"
                              : ""
                          }`}
                          style={{
                            width: `${widthPercent}%`,
                            background: `linear-gradient(135deg, ${DISK_COLORS[diskIndex]} 0%, ${DISK_COLORS[diskIndex]}dd 100%)`,
                          }}
                        >
                          {/* 3D highlights */}
                          <div className="absolute inset-x-2 top-0.5 h-1.5 rounded-full bg-white/20 blur-[0.5px]" />
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Restart Confirmation Overlay */}
      {confirmReset ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-[300px] sm:max-w-md rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-2xl">
            <h3
              className="text-lg sm:text-2xl font-bold text-slate-50"
              style={{ fontFamily: "var(--font-bungee)" }}
            >
              Restart game?
            </h3>
            <p className="mt-2 text-slate-300 text-xs sm:text-sm">
              You will lose all progress on the current board and restart the timer.
            </p>
            <div className="mt-4 sm:mt-6 flex gap-3">
              <button
                onClick={() => setConfirmReset(false)}
                className="w-1/2 rounded-full border border-slate-600 px-4 py-2 font-semibold text-xs sm:text-sm text-slate-300 hover:bg-white/5 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmRestart}
                className="w-1/2 rounded-full bg-red-500 text-slate-900 font-bold px-4 py-2 hover:bg-red-400 hover:shadow-[0_0_15px_rgba(239,68,68,0.4)] transition-all cursor-pointer text-xs sm:text-sm"
              >
                Proceed
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Main Menu Confirmation Overlay */}
      {confirmMainMenu ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-[300px] sm:max-w-md rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-2xl">
            <h3
              className="text-lg sm:text-2xl font-bold text-slate-50"
              style={{ fontFamily: "var(--font-bungee)" }}
            >
              Exit to Menu?
            </h3>
            <p className="mt-2 text-slate-300 text-xs sm:text-sm">
              Your current game progress will be lost. Are you sure you want to exit?
            </p>
            <div className="mt-4 sm:mt-6 flex gap-3">
              <button
                onClick={() => setConfirmMainMenu(false)}
                className="w-1/2 rounded-full border border-slate-600 px-4 py-2 font-semibold text-xs sm:text-sm text-slate-300 hover:bg-white/5 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => router.push("/")}
                className="w-1/2 rounded-full bg-red-500 text-slate-900 font-bold px-4 py-2 hover:bg-red-400 hover:shadow-[0_0_15px_rgba(239,68,68,0.4)] transition-all cursor-pointer text-xs sm:text-sm"
              >
                Exit
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Time's Up Reset Overlay */}
      {showTimeoutReset ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-[300px] sm:max-w-md rounded-2xl sm:rounded-3xl p-4 sm:p-6 flex flex-col text-center shadow-2xl">
            <h3
              className="text-xl sm:text-3xl font-bold text-red-400"
              style={{ fontFamily: "var(--font-bungee)" }}
            >
              Time's Up!
            </h3>
            <p className="mt-2 text-slate-300 text-xs sm:text-sm">
              The game has been reset after the time limit of {limitMinutes} minute{limitMinutes > 1 ? "s" : ""} ran out.
            </p>
            <button
              onClick={startNextAttempt}
              className="mt-4 sm:mt-6 w-full rounded-full bg-white px-6 py-2 sm:py-3 font-bold text-xs sm:text-sm text-slate-950 hover:bg-slate-200 transition-all cursor-pointer shadow-lg"
            >
              Try Again
            </button>
            <p className="mt-2 text-[10px] sm:text-xs text-slate-500 hidden sm:block">
              Or press <kbd className="bg-slate-800 px-1.5 py-0.5 rounded border border-slate-600 font-mono text-[9px] sm:text-[10px]">Enter</kbd> to continue
            </p>
          </div>
        </div>
      ) : null}

      {/* Rules Modal for Mobile */}
      {showRulesModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-[320px] sm:max-w-lg rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-2xl max-h-[85vh] sm:max-h-[90vh] flex flex-col justify-between">
            <div className="overflow-y-auto pr-0.5">
              <TowerRules content={rulesContent} />
            </div>
            <div className="mt-4 sm:mt-6 text-center border-t border-white/5 pt-3 sm:pt-4">
              <button
                onClick={() => setShowRulesModal(false)}
                className="w-full rounded-full bg-white px-6 py-2.5 sm:py-3 font-bold text-xs sm:text-sm text-slate-950 hover:bg-slate-200 transition-all cursor-pointer shadow-lg"
              >
                Close Guide
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function GamePage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-300">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-white mb-4"></div>
        <p className="text-sm">Loading game board...</p>
      </div>
    }>
      <GameContent />
    </Suspense>
  );
}

