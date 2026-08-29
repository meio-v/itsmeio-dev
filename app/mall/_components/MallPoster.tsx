import styles from "../mall.module.css";

export function MallPoster() {
  return (
    <div className={styles.poster} aria-hidden="true">
      <div className={styles.posterNoise} />
      <div className={styles.posterCeiling}>
        <span />
        <span />
        <span />
      </div>
      <div className={styles.posterStorefront}>
        <span>ARCADE</span>
      </div>
      <div className={styles.posterShutter} />
      <div className={styles.posterKiosk} />
      <div className={styles.posterLane} />
      <div className={styles.posterMoped}>
        <i />
        <i />
        <b />
      </div>
      <p className={styles.posterCaption}>MALL WING // AFTER HOURS</p>
    </div>
  );
}
