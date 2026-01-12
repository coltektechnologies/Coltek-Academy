import React from "react";

export default function Loader({ label = "Loading..." }: { label?: string }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-background/60 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4 p-6 rounded-xl shadow-lg bg-background/95 border">
        <span className="relative inline-flex h-12 w-12">
          <span className="absolute inline-flex h-full w-full rounded-full bg-primary/20 animate-ping" aria-hidden="true" />
          <svg
            className="h-12 w-12 animate-spin text-primary"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            role="img"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-90"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
            />
          </svg>
        </span>
        <div role="status" aria-live="polite" aria-busy="true" className="text-sm text-foreground/80">
          {label}
        </div>
      </div>
    </div>
  );
}
