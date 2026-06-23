// A small renderer to show rule content in a consistent glassmorphic block.
"use client";

type RuleContent = {
  title: string;
  intro?: string;
  bullets: string[];
};

export function TowerRules({ content }: { content: RuleContent }) {
  return (
    <div className="space-y-2 sm:space-y-4">
      <h2
        className="text-2xl sm:text-3xl font-bold text-slate-50"
        style={{ fontFamily: "var(--font-bungee)" }}
      >
        {content.title}
      </h2>
      {content.intro ? (
        <p className="text-xs sm:text-sm text-slate-200/90">{content.intro}</p>
      ) : null}
      <ol className="list-decimal space-y-1 sm:space-y-2 rounded-xl sm:rounded-2xl bg-white/5 pl-7 sm:pl-10 pr-1 sm:pr-2 py-2.5 sm:py-4 text-left text-xs sm:text-sm text-slate-100 marker:text-slate-300">
        {content.bullets.map((item) => (
          <li key={item} className="px-1 sm:px-4 leading-relaxed">{item}</li>
        ))}
      </ol>
    </div>
  );
}