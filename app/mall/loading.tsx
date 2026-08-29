import Link from "next/link";

import { MallPoster } from "./_components/MallPoster";
import styles from "./mall.module.css";

export default function MallLoading() {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div className={styles.utilityRail}>
          <Link href="/">itsmeio.dev</Link>
          <span aria-hidden="true">深夜営業中 / MALL WING 01 — AFTER HOURS</span>
        </div>
        <span className={styles.headerRule} aria-hidden="true" />
      </header>
      <section className={styles.loadingShell} aria-busy="true">
        <div>
          <p className={styles.kicker}>Mall wing / after hours</p>
          <h1>Opening the shutters.</h1>
          <p>The main site is already available if you would rather skip it.</p>
        </div>
        <MallPoster />
      </section>
    </main>
  );
}
