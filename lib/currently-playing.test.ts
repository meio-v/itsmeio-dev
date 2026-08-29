import assert from "node:assert/strict";
import test from "node:test";

import {
  formatCompletionDate,
  getRecentPreview,
  validateCurrentlyPlayingContent,
  type CurrentlyPlayingContent,
} from "./currently-playing.ts";

const validContent = {
  current: null,
  emptyMessage: "Check back later.",
  recentlyCompleted: [
    { title: "Newest", completed: "2026-03" },
    { title: "Same month", completed: "2026-03" },
    { title: "Coarse history", completed: "2024" },
  ],
} satisfies CurrentlyPlayingContent;

test("derives the recent preview from the canonical log", () => {
  assert.deepEqual(
    getRecentPreview(validContent, 2).map((game) => game.title),
    ["Newest", "Same month"],
  );
});

test("formats precise and coarse completion dates", () => {
  assert.equal(formatCompletionDate("2026-03"), "Mar 2026");
  assert.equal(formatCompletionDate("2024"), "2024");
});

test("accepts a null current game and newest-first history", () => {
  assert.equal(validateCurrentlyPlayingContent(validContent), validContent);
});

test("rejects invalid dates", () => {
  assert.throws(
    () =>
      validateCurrentlyPlayingContent({
        current: null,
        emptyMessage: "Check back later.",
        recentlyCompleted: [{ title: "Invalid", completed: "2026-13" }],
      }),
    /must be YYYY or YYYY-MM/,
  );
});

test("rejects completed games ordered oldest first", () => {
  assert.throws(
    () =>
      validateCurrentlyPlayingContent({
        current: null,
        emptyMessage: "Check back later.",
        recentlyCompleted: [
          { title: "Older", completed: "2025-01" },
          { title: "Newer", completed: "2026-01" },
        ],
      }),
    /newest first/,
  );
});
