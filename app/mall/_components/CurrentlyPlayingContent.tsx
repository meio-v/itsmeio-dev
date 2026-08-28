import {
  formatCompletionDate,
  formatCurrentStatus,
  getRecentPreview,
  type CurrentlyPlayingContent as CurrentlyPlayingContentType,
} from "@/lib/currently-playing";

import styles from "../mall.module.css";

export function CurrentlyPlayingContent({
  content,
  compact = false,
}: {
  content: CurrentlyPlayingContentType;
  compact?: boolean;
}) {
  const preview = getRecentPreview(content);
  const remaining = content.recentlyCompleted.slice(preview.length);

  return (
    <div className={styles.playingContent}>
      <div className={styles.currentGame}>
        <p className={styles.eyebrow}>Current</p>
        {content.current ? (
          <>
            <h3>{content.current.title}</h3>
            <p className={styles.gameMeta}>
              <span>{content.current.platform}</span>
              <span>{formatCurrentStatus(content.current.status)}</span>
            </p>
            {content.current.note && (
              <p className={styles.gameNote}>{content.current.note}</p>
            )}
          </>
        ) : (
          <p className={styles.betweenGames}>{content.emptyMessage}</p>
        )}
      </div>

      <div className={styles.completedGames}>
        <p className={styles.eyebrow}>Credits rolled</p>
        {preview.length > 0 ? (
          <>
            <ol>
              {preview.map((game) => (
                <li key={`${game.title}-${game.completed}`}>
                  <span>{game.title}</span>
                  <time dateTime={game.completed}>
                    {formatCompletionDate(game.completed)}
                  </time>
                </li>
              ))}
            </ol>
            {remaining.length > 0 && (
              <details className={styles.completedDisclosure} open={!compact}>
                <summary>
                  {compact ? "See the full log" : "Full log"}
                </summary>
                <ol start={preview.length + 1}>
                  {remaining.map((game) => (
                    <li key={`${game.title}-${game.completed}`}>
                      <span>{game.title}</span>
                      <time dateTime={game.completed}>
                        {formatCompletionDate(game.completed)}
                      </time>
                    </li>
                  ))}
                </ol>
              </details>
            )}
          </>
        ) : (
          <p className={styles.gameNote}>No completed games logged yet.</p>
        )}
      </div>
    </div>
  );
}
