"use client";

import { useState } from "react";
import { motion } from "motion/react";

/** "Report posted" notice with a copy-link button. There's no login, so this link is the way back. */
export function PostedNotice() {
  const [copied, setCopied] = useState(false);

  async function copy() {
    const url = window.location.href.replace(/\?new=1$/, "");
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copy this link:", url);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="mb-6 flex flex-col gap-3 rounded-2xl border border-accent/30 bg-accent/5 p-4 sm:flex-row sm:items-center sm:justify-between"
    >
      <div>
        <p className="font-medium">Your report is live.</p>
        <p className="text-sm text-muted">Save this page’s link to come back and check for new matches.</p>
      </div>
      <button
        type="button"
        onClick={copy}
        className="shrink-0 rounded-xl border border-line bg-card px-4 py-2 text-sm font-medium transition-transform duration-150 active:scale-[0.97]"
      >
        {copied ? "Link copied ✓" : "Copy link"}
      </button>
    </motion.div>
  );
}
