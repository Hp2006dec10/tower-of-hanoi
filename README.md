# Tower of Hanoi

A premium, responsive, and highly interactive Next.js implementation of the classic mathematical puzzle. Configured with customizable settings, multiple game modes, glassmorphism UI styles, and smooth tactile animations.

## 🎯 Features

*   **Adjustable Difficulty (3 to 8 Disks)**: Choose anywhere from 3 disks (7 min moves) up to a full 8-disk layout (255 min moves) to challenge your skills.
*   **Dual Game Modes**:
    *   🧘 **Zen Mode**: Relax, think ahead, and solve the puzzle at your own pace with a count-up stopwatch.
    *   ⏳ **Timed Challenge**: Solve the puzzle before the clock runs out! Configurable time limits (1, 2, 3, 5, or 10 minutes) with auto-reset and timeout modals.
*   **Fully Responsive & Mobile-Optimized**:
    *   Built using dynamic viewport constraints (`min-h-[100dvh]`) to ensure the board fits on small phone viewports without clipping.
    *   Uses responsive disk width scaling (re-scaling from 25%–95% on desktop down to a wider, tap-friendly 40%–98% on mobile).
    *   Auto-adjusts disk gap heights dynamically depending on total disk count to prevent overflow.
    *   Includes a collapsible **How to Play** rules drawer overlay on smaller screens.
*   **Tactile Premium Graphics**:
    *   Polished glossy 3D-styled disk capsule designs.
    *   Active/selected pegs show glowing pulse states.
    *   Eligible destination rods glow green to show valid move targets.
    *   Invalid disk drops trigger a tactile red flash and shake animation.
    *   Includes a **Menu** button next to **Restart** with safety confirmation popups.

## 🛠️ Tech Stack

*   **Framework**: Next.js 16 (App Router)
*   **Runtime**: React 19
*   **Styling**: Tailwind CSS v4 & custom CSS keyframes
*   **Language**: TypeScript

## 🚀 Getting Started

First, install dependencies:

```bash
npm install
```

Then, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to play the game.

## 📦 Building

To generate the production optimized bundle:

```bash
npm run build
```
