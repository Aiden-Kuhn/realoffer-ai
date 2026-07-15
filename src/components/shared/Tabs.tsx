"use client";

import { useId, type KeyboardEvent } from "react";

export type TabItem = {
  value: string;
  label: string;
};

type TabsProps = {
  items: TabItem[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
};

export function Tabs({ items, value, onChange, className = "" }: TabsProps) {
  const groupId = useId();

  function onKeyDown(event: KeyboardEvent, index: number) {
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
    event.preventDefault();
    const nextIndex =
      event.key === "ArrowRight" ? (index + 1) % items.length : (index - 1 + items.length) % items.length;
    onChange(items[nextIndex].value);
    const nextButton = document.getElementById(`${groupId}-tab-${items[nextIndex].value}`);
    nextButton?.focus();
  }

  return (
    <div role="tablist" aria-orientation="horizontal" className={`inline-flex items-center gap-1 rounded-xl border border-border bg-surface p-1 ${className}`}>
      {items.map((item, index) => {
        const selected = item.value === value;
        return (
          <button
            key={item.value}
            id={`${groupId}-tab-${item.value}`}
            role="tab"
            type="button"
            aria-selected={selected}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(item.value)}
            onKeyDown={(e) => onKeyDown(e, index)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 ${
              selected ? "bg-white/10 text-white" : "text-white/55 hover:text-white/85"
            }`}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
