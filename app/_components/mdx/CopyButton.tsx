"use client";

import { useState, useCallback } from "react";

export function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [text]);

  return (
    <button
      onClick={handleCopy}
      style={{
        position: "absolute",
        top: 8,
        right: 8,
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: 10,
        letterSpacing: 1,
        background: "rgba(136,204,136,0.15)",
        color: "var(--psx-mgs-text)",
        border: "1px solid rgba(136,204,136,0.3)",
        padding: "4px 8px",
        cursor: "pointer",
        transition: "all 0.15s",
      }}
    >
      {copied ? "COPIED" : "COPY"}
    </button>
  );
}
