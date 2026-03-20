"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { TowerRules } from "../shared/rules";
import { db } from "../../firebase";
import { onSnapshot, doc } from "firebase/firestore";

type GameToken = {
  status: "playing" | "completed";
  startTime: number;
  moves?: number;
  completedAt?: number;
};

const STORAGE_KEY = "hanoiStatus";
const DISK_COLORS = ["#a855f7", "#3b82f6", "#22c55e", "#f59e0b", "#ef4444"];
// Index 0 = smallest radius (top), Index 4 = largest radius (bottom)
// Array represents bottom to top: [4, 3, 2, 1, 0] means 4 at bottom, 0 at top
const INITIAL_PEGS = [
  [4, 3, 2, 1, 0], // Largest (4) at bottom, smallest (0) at top
  [],
  [],
] as [number[], number[], number[]];

type PegState = [number[], number[], number[]];
type Data = {
  time : number;
}
export default function GamePage() {
  const [pegs, setPegs] = useState<PegState>(INITIAL_PEGS);
  const [selected, setSelected] = useState<number | null>(null);
  const [moves, setMoves] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [invalidPeg, setInvalidPeg] = useState<number | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [timer, setTimer] = useState(120000);
  const [showTimeoutReset, setShowTimeoutReset] = useState(false);
  const [waitingForEnter, setWaitingForEnter] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();

  useEffect(() => {
    const getTimer = () => {
      const unsubscribe = onSnapshot(doc(db, 'timer', 'timer-doc'), (snapshot) => {
        const data = snapshot.data();
        if (!data) return;
        const timer = data.time;
        setTimer(timer);
        console.log(timer);
      })
      return unsubscribe;
    }

    const unsubscribe = getTimer();
    return () => unsubscribe();
  }, [])

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const now = Date.now();
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ status: "playing", startTime: now, moves: 0 })
      );
      setStartTime(now);
      return;
    }
    try {
      const token = JSON.parse(raw) as GameToken;
      if (token.status === "completed") {
        router.replace("/completed");
        return;
      }
      setStartTime(token.startTime);
      setMoves(token.moves ?? 0);
    } 
    catch (err) {
      console.error("Could not parse token", err);
      const now = Date.now();
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ status: "playing", startTime: now, moves: 0 })
      );
      setStartTime(now);
    }
  }, [router]);

  const handleTimeoutReset = () => {
    // Stop the timer
    timerRef.current && clearInterval(timerRef.current);
    // Reset game state
    setPegs(INITIAL_PEGS);
    setMoves(0);
    setSelected(null);
    setElapsed(0);
    setStartTime(null);
    // Update localStorage
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ status: "playing", startTime: 0, moves: 0 })
    );
    // Show popup and wait for Enter key
    setShowTimeoutReset(true);
    setWaitingForEnter(true);
  }

  useEffect(() => {
    if (!startTime || waitingForEnter) return;
    timerRef.current && clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      const newElapsed = Date.now() - startTime;
      setElapsed(newElapsed);
      // Check if 2 minutes (120000ms) has passed
      if (newElapsed >= timer * 60000) {
        handleTimeoutReset();
      }
    }, 1000);
    return () => {
      timerRef.current && clearInterval(timerRef.current);
    };
  }, [startTime, waitingForEnter, handleTimeoutReset]);

  const timeLabel = useMemo(() => {
    const totalSeconds = Math.floor(elapsed / 1000);
    const hours = Math.floor(totalSeconds / 3600)
      .toString()
      .padStart(2, "0");
    const minutes = Math.floor((totalSeconds % 3600) / 60)
      .toString()
      .padStart(2, "0");
    const seconds = Math.floor(totalSeconds % 60)
      .toString()
      .padStart(2, "0");
    return `${hours}:${minutes}:${seconds}`;
  }, [elapsed]);

  const howToPlayContent = useMemo(
    () => ({
      title: "How to Play",
      bullets: [
        "Click the top disk of any peg to lift it.",
        "Click another peg to place the lifted disk.",
        "You cannot place a larger disk on a smaller one.",
        "One player can only make one move at a time.",
        "You can also drag a disk and drop it into another peg.",
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
      // Find the disk with lowest index (smallest radius) - this is at the end of array (top)
      if (updated[from].length === 0) return prev;
      const disk = updated[from].pop()!; // Top disk (smallest index)
      
      // Check if target peg is empty or has a disk with larger index (larger radius) at top
      const targetTop = updated[to].length > 0 ? updated[to][updated[to].length - 1] : undefined;
      if (targetTop !== undefined && targetTop < disk) {
        setInvalidPeg(to);
        setTimeout(() => setInvalidPeg(null), 300);
        updated[from].push(disk); // Put it back
        return prev;
      }
      // Add disk to top of target peg (push to end of array)
      updated[to].push(disk);
      const nextMoves = moves + 1;
      setMoves(nextMoves);
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        try {
          const token = JSON.parse(raw) as GameToken;
          localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({ ...token, moves: nextMoves, status: "playing" })
          );
        } catch (err) {
          console.error("Failed to update moves", err);
        }
      }
      // Win condition: [4, 3, 2, 1, 0] on third peg (index 4 at bottom, index 0 at top)
      const didWin = updated[2].length === 5 && updated[2].every((v, i) => v === 4 - i);
      if (didWin) {
        const completion = Date.now();
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            status: "completed",
            startTime: startTime ?? Date.now(),
            completedAt: completion,
            moves: nextMoves,
          })
        );
        setTimeout(() => router.push("/completed"), 350);
      }
      return updated;
    });
    setSelected(null);
  };

  const handlePegClick = (index: number) => {
    if (selected === null) {
      if (pegs[index].length === 0) return;
      // Select the peg with the disk that has lowest index (smallest radius)
      setSelected(index);
      return;
    }
    if (selected === index) {
      setSelected(null);
      return;
    }
    // Get the smallest disk (lowest index) from source peg - it's at the end (top)
    const sourceMin = pegs[selected].length > 0 ? pegs[selected][pegs[selected].length - 1] : undefined;
    const targetMin = pegs[index].length > 0 ? pegs[index][pegs[index].length - 1] : undefined;
    if (sourceMin === undefined) {
      setSelected(null);
      return;
    }
    // Can only place if target is empty or has a larger disk (higher index)
    if (targetMin !== undefined && targetMin < sourceMin) {
      setInvalidPeg(index);
      setTimeout(() => setInvalidPeg(null), 300);
      return;
    }
    moveDisk(selected, index);
  };

  const handleDragStart = (pegIdx: number) => {
    if (pegs[pegIdx].length === 0) return false;
    // Select the peg with the smallest disk (lowest index)
    setSelected(pegIdx);
    return true;
  };

  const handleDrop = (pegIdx: number) => {
    if (selected === null) return;
    handlePegClick(pegIdx);
  };

  const confirmRestart = () => {
    setConfirmReset(false);
    const now = Date.now();
    setPegs(INITIAL_PEGS);
    setMoves(0);
    setSelected(null);
    setElapsed(0);
    setStartTime(now);
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ status: "playing", startTime: now, moves: 0 })
    );
  };

  const startNextAttempt = useCallback(() => {
    const now = Date.now();
    setStartTime(now);
    setElapsed(0);
    setShowTimeoutReset(false);
    setWaitingForEnter(false);
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ status: "playing", startTime: now, moves: 0 })
    );
  }, []);

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
    <div className="flex w-full gap-6 h-screen">
      {/* Main Game Area */}
      <div className="relative w-full flex items-center gap-6 px-2">
        {/* How to Play - Left Sidebar */}
        <aside className="hidden lg:block w-1/4 mt-40">
            <div className="glass-card h-full rounded-3xl px-5 py-5">
                <TowerRules content={howToPlayContent} />
            </div>
        </aside>
        {/* Game Board Container */}
        <div className="relative pt-24 w-full lg:w-1/2 mx-30">
            {/* Floating Controls Above Board */}
            <div className="flex items-center justify-between z-10 pointer-events-none px-4 max-w-2xl mx-auto my-4">
                <div className="glass-card rounded-full px-4 py-2 text-sm font-medium text-slate-200 pointer-events-auto shadow-lg">
                Timer: <span className="text-lg font-bold">{timeLabel}</span>
                </div>
                <div className="flex items-center gap-3 pointer-events-auto">
                <div className="glass-card rounded-full px-4 py-2 text-sm font-semibold text-slate-100 shadow-lg">
                    {moves} moves
                </div>
                <button
                    onClick={() => setConfirmReset(true)}
                    className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-200 shadow-lg cursor-pointer"
                >
                    Restart
                </button>
                </div>
            </div>

            {/* Single Glass Container with All Three Pegs */}
            <div className="glass-card relative rounded-3xl py-8 max-w-3xl mx-auto">
                <h2
                className="mb-6 text-2xl font-bold text-slate-50 text-center"
                style={{ fontFamily: "var(--font-bungee)" }}
                >
                Tower Board
                </h2>
                <div className="relative flex h-[250px] items-center justify-between gap-4 px-4">
                  {pegs.map((peg, pegIdx) => (
                      <div
                      key={pegIdx}
                      className={`flex h-full cursor-pointer glass-strong rounded-2xl py-4 w-1/3 flex-col items-center justify-end gap-2 transition ${
                          invalidPeg === pegIdx ? "peg-invalid" : ""
                      } ${selected === pegIdx ? "ring-2 ring-sky-400" : ""}`}
                      onClick={() => handlePegClick(pegIdx)}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                          e.preventDefault();
                          handleDrop(pegIdx);
                      }}
                      >
                      <div className="relative flex h-full w-full items-end justify-center">
                          <div className="absolute left-1/2 h-full -translate-x-1/2 w-2 rounded-full bg-slate-200/80" />
                          <div className="relative flex w-full flex-col items-center justify-end pb-2">
                          {peg.slice().reverse().map((diskIndex, reverseIdx) => {
                              
                              const actualIdx = peg.length - 1 - reverseIdx;
                              const widthPercent = 15 + (diskIndex + 1) * 10;
                              const isTop = actualIdx === peg.length - 1;
                              return (
                              <div
                                  key={`${pegIdx}-${diskIndex}-${actualIdx}`}
                                  draggable={isTop}
                                  onDragStart={(e) => {
                                  const allowed = handleDragStart(pegIdx);
                                  if (!allowed) e.preventDefault();
                                  }}
                                  className={`h-8 rounded-full text-center text-sm font-bold text-slate-900 shadow-lg transition-transform cursor-pointer ${
                                  isTop && selected === pegIdx
                                      ? "-translate-y-4"
                                      : ""
                                  }`}
                                  style={{
                                  width: `${widthPercent}%`,
                                  background: DISK_COLORS[diskIndex] ?? "#38bdf8",
                                  }}
                              >
                              </div>
                              );
                          })}
                          </div>
                      </div>
                      </div>
                  ))}
                </div>
            </div>
        </div>
      </div>

      {confirmReset ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-black w-full max-w-md rounded-3xl px-6 py-6">
            <h3
              className="text-2xl font-bold text-slate-50"
              style={{ fontFamily: "var(--font-bungee)" }}
            >
              Restart game?
            </h3>
            <p className="mt-3 text-slate-200">
              You will lose your progress on restart, and the game must be
              started from Player 1.
            </p>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setConfirmReset(false)}
                className="w-1/2 rounded-full border border-slate-400 px-4 py-2 font-semibold text-slate-200 transition hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={confirmRestart}
                className="w-1/2 rounded-full bg-white px-4 py-2 font-semibold text-slate-900 transition hover:bg-slate-200"
              >
                Proceed
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {showTimeoutReset ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-black border border-white w-full max-w-md rounded-3xl px-6 py-6 flex flex-col">
            <h3
              className="text-2xl font-bold text-slate-50"
              style={{ fontFamily: "var(--font-bungee)" }}
            >
              Time's Up!
            </h3>
            <p className="mt-3 text-slate-200">
              The game has been reset after {timer > 1 ? `${timer} minutes` : timer == 1 ? `1 minute` : `${timer * 60} seconds`}. Press Enter to start the next attempt.
            </p>
            <p className="mt-6 text-center text-sm font-medium flicker-text">
              Press Enter to continue
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
