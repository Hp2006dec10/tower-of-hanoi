// A small renderer to show rule content in a consistent glassmorphic block.
"use client";

type RuleContent = {
  title: string;
  intro?: string;
  bullets: string[];
};

export function TowerRules({ content }: { content: RuleContent }) {
  return (
    <div className="space-y-4">
      <h2
        className="text-3xl font-bold text-slate-50"
        style={{ fontFamily: "var(--font-bungee)" }}
      >
        {content.title}
      </h2>
      {content.intro ? (
        <p className="text-slate-200/90">{content.intro}</p>
      ) : null}
      <ol className="list-decimal space-y-2 rounded-2xl bg-white/5 pl-10 pr-2 py-4 text-left text-slate-100 marker:text-slate-300">
        {content.bullets.map((item) => (
          <li key={item} className="px-4">{item}</li>
        ))}
      </ol>
    </div>
  );
}