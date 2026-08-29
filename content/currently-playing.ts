import {
  validateCurrentlyPlayingContent,
  type CurrentlyPlayingContent,
} from "../lib/currently-playing";

export const currentlyPlayingContent = validateCurrentlyPlayingContent({
  current: null,
  emptyMessage:
    "My attention span cannot finish a game at the moment. Check back later.",
  recentlyCompleted: [
    { title: "Resident Evil Requiem", completed: "2026-03" },
    { title: "Uncharted 4: A Thief's End", completed: "2026-03" },
    { title: "God of War Ragnarok", completed: "2026-02" },
    { title: "Control", completed: "2026-01" },
    { title: "Borderlands 4", completed: "2026-01" },
    { title: "Lost Judgement", completed: "2025-09" },
    { title: "Split Fiction", completed: "2025-09" },
    { title: "Borderlands 3", completed: "2025-04" },
    { title: "Metaphor Refantazio", completed: "2025-04" },
    { title: "Spiderman 2", completed: "2025-03" },
    { title: "AC Odyssey", completed: "2025-02" },
    { title: "Ghost of Tsushima", completed: "2024-08" },
    {
      title: "Cyberpunk 2077 Phantom Liberty",
      completed: "2024-07",
    },
    { title: "RGG Infinite Wealth", completed: "2024-06" },
    { title: "Persona 3 Reload", completed: "2024" },
    { title: "Resi 4 Remake", completed: "2024-01" },
  ],
} satisfies CurrentlyPlayingContent);
