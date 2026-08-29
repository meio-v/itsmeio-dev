export type CurrentGame = {
  title: string;
  platform: string;
  status: "playing" | "paused";
  note?: string;
};

export type CompletedGame = {
  title: string;
  completed: string;
};

export type CurrentlyPlayingContent = {
  current: CurrentGame | null;
  emptyMessage: string;
  recentlyCompleted: readonly CompletedGame[];
};

const COMPLETION_DATE = /^\d{4}(?:-(?:0[1-9]|1[0-2]))?$/;
const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

function assertText(value: string, field: string) {
  if (value.trim().length === 0) {
    throw new Error(`${field} must not be empty`);
  }
}

export function validateCurrentlyPlayingContent<
  const T extends CurrentlyPlayingContent,
>(content: T): T {
  assertText(content.emptyMessage, "emptyMessage");

  if (content.current) {
    assertText(content.current.title, "current.title");
    assertText(content.current.platform, "current.platform");

    if (content.current.note?.includes("\n")) {
      throw new Error("current.note must be one short paragraph");
    }
  }

  let previousDate: string | null = null;

  content.recentlyCompleted.forEach((game, index) => {
    assertText(game.title, `recentlyCompleted[${index}].title`);

    if (!COMPLETION_DATE.test(game.completed)) {
      throw new Error(
        `recentlyCompleted[${index}].completed must be YYYY or YYYY-MM`,
      );
    }

    if (previousDate !== null) {
      const [previousYear, previousMonth] = previousDate.split("-");
      const [year, month] = game.completed.split("-");

      if (
        year > previousYear ||
        (year === previousYear &&
          previousMonth !== undefined &&
          month !== undefined &&
          month > previousMonth)
      ) {
        throw new Error("recentlyCompleted must be sorted newest first");
      }
    }
    previousDate = game.completed;
  });

  return content;
}

export function getRecentPreview(
  content: CurrentlyPlayingContent,
  count = 3,
) {
  return content.recentlyCompleted.slice(0, count);
}

export function formatCompletionDate(value: string) {
  if (!COMPLETION_DATE.test(value)) {
    throw new Error(`Invalid completion date: ${value}`);
  }

  const [year, month] = value.split("-");
  if (!month) return year;

  return `${MONTHS[Number(month) - 1]} ${year}`;
}

export function formatCurrentStatus(status: CurrentGame["status"]) {
  return status === "playing" ? "In progress" : "Paused";
}
