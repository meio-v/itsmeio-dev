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
          <>
            <p className={styles.noDisc}>No disc inserted</p>
            <p className={styles.betweenGames}>{content.emptyMessage}</p>
          </>
        )}
      </div>

      <div className={styles.completedGames}>
        <div className={styles.completedHeading}>
          <h3><span>Recently</span><span>Completed</span></h3>
          <span aria-hidden="true">SAVE LOG</span>
        </div>
        {preview.length > 0 ? (
          <>
            <div className={styles.gameTableHeader} aria-hidden="true">
              <span>Game</span><span>Cleared</span>
            </div>
            <ol>
              {preview.map((game, index) => (
                <li key={`${game.title}-${game.completed}`}>
                  <span className={styles.saveNumber}>{String(index + 1).padStart(2, "0")}</span>
                  <span>{game.title}</span>
                  <time dateTime={game.completed}>
                    {formatCompletionDate(game.completed)}
                  </time>
                </li>
              ))}
            </ol>
            {remaining.length > 0 && (
              <details className={styles.completedDisclosure}>
                <summary>
                  {compact ? "See the full log" : "Full log"}
                </summary>
                <ol start={preview.length + 1}>
                  {remaining.map((game, index) => (
                    <li key={`${game.title}-${game.completed}`}>
                      <span className={styles.saveNumber}>{String(index + preview.length + 1).padStart(2, "0")}</span>
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
