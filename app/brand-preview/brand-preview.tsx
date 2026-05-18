"use client";

import { Logomark } from "@/components/brand/logomark";
import { useState } from "react";

const VARIANTS = ["none", "subtle", "pulse", "draw"] as const;

const SIZES = [24, 32, 48, 80, 128];

const DESCRIPTIONS: Record<string, { title: string; concept: string }> = {
  none: {
    title: "Static",
    concept: "No animation applied",
  },
  subtle: {
    title: "Subtle",
    concept: "Gentle breathing effect",
  },
  pulse: {
    title: "Pulse",
    concept: "Energy pulse with neon glow",
  },
  draw: {
    title: "Draw",
    concept: "Paths sketching in",
  },
};

export function BrandPreview() {
  const [animated, setAnimated] = useState(true);

  return (
    <div className="flex min-h-screen flex-col items-center gap-12 bg-background p-8 text-foreground">
      {/* Toggle */}
      <div className="flex items-center gap-3">
        <button
          className="rounded-sm border border-border bg-muted px-3 py-1 text-xs"
          onClick={() => setAnimated((a) => !a)}
          type="button"
        >
          Animation: {animated ? "ON" : "OFF"}
        </button>
        <span className="text-xs text-muted-foreground">
          (uses motion/react — respects prefers-reduced-motion)
        </span>
      </div>

      {VARIANTS.map((variant) => {
        const meta = DESCRIPTIONS[variant];
        return (
          <section
            key={variant}
            className="flex flex-col items-center gap-4"
          >
            <h2 className="text-lg font-semibold">{meta.title}</h2>
            <p className="text-xs text-muted-foreground">{meta.concept}</p>

            {/* Same variant at different sizes */}
            <div className="flex items-center gap-6">
              {SIZES.map((size) => (
                <div
                  key={size}
                  className="flex flex-col items-center gap-1"
                >
                  <Logomark
                    animate={animated}
                    size={size}
                    variant={variant}
                  />
                  <span className="text-[10px] text-muted-foreground">
                    {size}px
                  </span>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-4">
              <span className="text-xs text-muted-foreground">on dark:</span>
              <div className="flex items-center gap-4 rounded-md bg-foreground p-4">
                {SIZES.slice(0, 3).map((size) => (
                  <Logomark
                    key={size}
                    animate={animated}
                    size={size}
                    variant={variant}
                    className="text-background"
                  />
                ))}
              </div>
            </div>
          </section>
        );
      })}
    </div>
  );
}
