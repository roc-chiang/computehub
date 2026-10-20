"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

export function CitationCopyButton({ citation }: { citation: string }) {
  const [status, setStatus] = useState<"idle" | "copied" | "failed">("idle");

  const copyCitation = async () => {
    try {
      await navigator.clipboard.writeText(citation);
      setStatus("copied");
    } catch {
      setStatus("failed");
    }
    window.setTimeout(() => setStatus("idle"), 1800);
  };

  return (
    <button
      type="button"
      onClick={copyCitation}
      className="mt-5 inline-flex min-h-10 items-center gap-2 border border-[#202522] px-3 text-xs font-semibold transition-colors hover:bg-[#e5e0d4] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
      aria-live="polite"
    >
      {status === "copied" ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      {status === "copied" ? "Copied" : status === "failed" ? "Copy failed" : "Copy citation"}
    </button>
  );
}
